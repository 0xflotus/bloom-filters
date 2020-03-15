/* file : count-min-sketch.ts
MIT License

Copyright (c) 2017-2020 Thomas Minier & Arnaud Grall

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

'use strict'

import * as utils from './utils'
import { Exportable } from './exportable'
import { assertFields, cloneObject } from './export-import-specs'
import BaseFilter from './base-filter'

/**
 * The count–min sketch (CM sketch) is a probabilistic data structure that serves as a frequency table of events in a stream of data.
 * It uses hash functions to map events to frequencies, but unlike a hash table uses only sub-linear space, at the expense of overcounting some events due to collisions.
 *
 * Reference: Cormode, G., & Muthukrishnan, S. (2005). An improved data stream summary: the count-min sketch and its applications. Journal of Algorithms, 55(1), 58-75.
 * @see {@link http://vaffanculo.twiki.di.uniroma1.it/pub/Ing_algo/WebHome/p14_Cormode_JAl_05.pdf} for more details on Count Min Sketch
 * @extends Exportable
 * @author Thomas Minier & Arnaud Grall
 * console.log(sketch.count('daniel')); // output: 0
 */
@Exportable({
  export: cloneObject('CountMinSketch', '_matrix', '_seed', '_N', '_rows', '_columns'),
  import: (json: any) => {
    if ((json.type !== 'CountMinSketch') || !assertFields(json, '_matrix', '_seed', '_N', '_rows', '_columns')) {
      throw new Error('Cannot create a CountMinSketch from a JSON export which does not represent a count-min sketch')
    }
    const sketch = new CountMinSketch(json._columns, json._rows)
    sketch._matrix = json._matrix.slice()
    sketch._N = json._N
    sketch.seed = json._seed
    return sketch
  }
})
export default class CountMinSketch extends BaseFilter{
  private _columns: number
  private _rows: number
  private _matrix: Array<Array<number>>
  private _N: number
  /**
   * Constructor. Creates a new Count-Min Sketch whose relative accuracy is within a factor of epsilon with probability delta.
   * @param {number} w Number of columns
   * @param {number} d Number of rows
   * @param {UINT64} seed the seed
   */
  constructor (w = 2048, d = 1, seed = utils.getDefaultSeed()) {
    super()
    this._columns = w
    this._rows = d
    this._matrix = utils.allocateArray(this._rows, () => utils.allocateArray(this._columns, 0))
    this._N = 0
  }

  /**
   * Create a count-min sketch given an epsilon and delta (default create(0.001, 0.999))
   * w = Math.ceil(Math.E / epsilon) and d = Math.ceil(Math.log(1 / delta))
   * @param  {Number} epsilon the error rate
   * @param  {Number} delta   probability of accuracy
   * @return {CountMinSketch}
   */
  static create (epsilon = 0.001, delta = 0.999) {
    const w = Math.ceil(Math.E / epsilon)
    const d = Math.ceil(Math.log(1 / delta))
    return new CountMinSketch(w, d)
  }

  /**
   * Return the number of columns of the matrix
   * @return {Number}
   */
  get w () {
    return this._columns
  }

  /**
   * Return the number of rows of the matrix
   * @return {Number}
   */
  get d () {
    return this._rows
  }

  /**
   * Get the sum of all counts
   */
  get N () {
    return this._N
  }

  /**
   * Update the count min sketch with a new occurrence of an element
   * @param {string} element - The new element
   */
  update (element, count = 1) {
    this._N += count
    const indexes = utils.getDistinctIndices(element, this._columns, this._rows, this.seed)
    for (let i = 0; i < this._rows; i++) {
      this._matrix[i][indexes[i]] += count
    }
  }

  /**
   * Perform a point query, i.e. estimate the number of occurence of an element
   * @param {string} element - The element we want to count
   * @return {int} The estimate number of occurence of the element
   */
  count (element) {
    let min = Infinity
    const indexes = utils.getDistinctIndices(element, this._columns, this._rows, this.seed)
    for (let i = 0; i < this._rows; i++) {
      const v = this._matrix[i][indexes[i]]
      min = Math.min(v, min)
    }

    return min
  }

  /**
   * Merge (in place) this sketch with another sketch, if they have the same number of columns and rows.
   * @param {CountMinSketch} sketch - The sketch to merge with
   * @throws Error
   */
  merge (sketch) {
    if (this._columns !== sketch._columns) throw new Error('Cannot merge two sketches with different number of columns')
    if (this._rows !== sketch._rows) throw new Error('Cannot merge two sketches with different number of rows')

    for (let i = 0; i < this._rows; i++) {
      for (let j = 0; j < this._columns; j++) {
        this._matrix[i][j] += sketch._matrix[i][j]
      }
    }
  }

  /**
   * Clone the sketch
   * @return {CountMinSketch} A new cloned sketch
   */
  clone () {
    const sketch = new CountMinSketch(this._columns, this._rows)
    sketch.merge(this)
    sketch.seed = this.seed
    return sketch
  }
}
