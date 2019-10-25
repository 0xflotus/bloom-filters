# Bloom-Filters
[![Build Status](https://travis-ci.org/Callidon/bloom-filters.svg?branch=master)](https://travis-ci.org/Callidon/bloom-filters) [![codecov](https://codecov.io/gh/Callidon/bloom-filters/branch/master/graph/badge.svg)](https://codecov.io/gh/Callidon/bloom-filters)

**Keywords:** bloom, filter, bloom filter, probabilistic, datastructure

JS implementation of probabilistic data structures: Bloom Filter (and its derived), HyperLogLog, Count-Min Sketch, Top-K and MinHash

**Use non-cryptographic hash internally since (v0.7.0)** [XXHASH](https://cyan4973.github.io/xxHash/)

**Breaking API changes from the 0.7.1 to the 1.0.0 version.**

[Online documentation](https://callidon.github.io/bloom-filters/)

# Table of contents

* [Installation](#installation)
* [Data structures](#data-structures)
	* [Classic Bloom Filter](#classic-bloom-filter)
	* [Partitioned Bloom Filter](#partitioned-bloom-filter)
	* [Cuckoo Filter](#cuckoo-filter)
	* [Counting Bloom Filter](#counting-bloom-filter)
	* [Count Min Sketch](#count-min-sketch)
  * [Invertible Bloom Filters (Key)](#invertible-bloom-filters)
* [Export and import](#export-and-import)
* [Documentation](#documentation)
* [Tests](#tests)
* [References](#references)
* [Changelog](#changelog)
* [License](#license)

## Installation

```bash
  npm install bloom-filters --save
```

## Data structures

### Classic Bloom Filter

A Bloom filter is a space-efficient probabilistic data structure, conceived by Burton Howard Bloom in 1970,
that is used to test whether an element is a member of a set. False positive matches are possible, but false negatives are not.

**Reference:** Bloom, B. H. (1970). *Space/time trade-offs in hash coding with allowable errors*. Communications of the ACM, 13(7), 422-426.
([Full text article](http://crystal.uta.edu/~mcguigan/cse6350/papers/Bloom.pdf))

```javascript
const { BloomFilter } = require('bloom-filters')

// create a Bloom Filter with size = 15 and 1% error rate
let filter = BloomFilter.create(15, 0.01)

// alternatively, create an optimal Bloom Filter from an array with 1% error rate for the array provided
filter = BloomFilter.from([ 'alice', 'bob' ], 0.01)
// or create an optimal bloom filter for specified number of elements and error rate
filter = BloomFilter.create(1000, 0.001)
// add some value in the filter
filter.add('alice')
filter.add('bob')

// lookup for some data
console.log(filter.has('bob')) // output: true
console.log(filter.has('daniel')) // output: false

// print false positive rate (around 0.001)
console.log(filter.rate())
```

### Partitioned Bloom Filter

A Partitioned Bloom Filter is a variation of a classic Bloom Filter.

This filter works by partitioning the M-sized bit array into k slices of size `m = M/k` bits, `k = nb of hash functions` in the filter.
Each hash function produces an index over `m` for its respective slice.
Thus, each element is described by exactly `k` bits, meaning the distribution of false positives is uniform across all elements.

Be careful, as a Partitioned Bloom Filter have much higher collison risks that a classic Bloom Filter on small sets of data.

**Reference:** Chang, F., Feng, W. C., & Li, K. (2004, March). *Approximate caches for packet classification.* In INFOCOM 2004. Twenty-third AnnualJoint Conference of the IEEE Computer and Communications Societies (Vol. 4, pp. 2196-2207). IEEE.
([Full text article](http://citeseerx.ist.psu.edu/viewdoc/download?doi=10.1.1.153.6902&rep=rep1&type=pdf))

Otherwise, a Partitioned Bloom Filter **follows the same API than a [Classic Bloom Filter](#classic-bloom-filter)**.

```javascript
const { PartitionedBloomFilter } = require('bloom-filters')

// create a PartitionedBloomFilter for 10 elements with an error rate of 1% within a load factor of 0.5
const filter = PartitionedBloomFilter.create(10, 0.01, 0.5)
// if you want to customize all parameter you can create the Filter manually
// const filter = new PartitionedBloomFilter(totalBits, hashFunctions, loadFactor)

// add some value in the filter
filter.add('alice')
filter.add('bob')

// lookup for some data
console.log(filter.has('bob')) // output: true
console.log(filter.has('daniel')) // output: false

// now use it like a classic bloom filter!
// ...
```

### Cuckoo Filter

Cuckoo filters improve on Bloom filters by supporting deletion, limited counting, and bounded False positive rate with similar storage efficiency as a standard Bloom Filter.

**Reference:** Fan, B., Andersen, D. G., Kaminsky, M., & Mitzenmacher, M. D. (2014, December). *Cuckoo filter: Practically better than bloom.* In Proceedings of the 10th ACM International on Conference on emerging Networking Experiments and Technologies (pp. 75-88). ACM.
([Full text article](https://www.cs.cmu.edu/~dga/papers/cuckoo-conext2014.pdf))

**Important**: The error rate can go up to 1.10^-18 = (0.000000000000000001). After this, You will get an error saying that the fingerprint length is higher than the hash length.

```javascript
const { CuckooFilter } = require('bloom-filters')

// create a Cuckoo Filter with size = 15, fingerprint length = 3 and bucket size = 2
const filter = new CuckooFilter(15, 3, 2)
// or create a CuckooFilter for 2 elements, with an error rate of 0.01 and a bucketSize of 2
filter = CuckooFilter.create(2, 0.01, 2)
filter.add('alice')
filter.add('bob')

// lookup for some data
console.log(filter.has('bob')) // output: true
console.log(filter.has('daniel')) // output: false

// remove something
filter.remove('bob')
console.log(filter.has('bob')) // output: false
```

### Counting Bloom Filter

A Counting Bloom filter works in a similar manner as a regular Bloom filter; however, it is able to keep track of insertions and deletions. In a counting Bloom filter, each entry in the Bloom filter is a small counter associated with a basic Bloom filter bit.

**Reference:** F. Bonomi, M. Mitzenmacher, R. Panigrahy, S. Singh, and G. Varghese, “An Improved Construction for Counting Bloom Filters,” in 14th Annual European Symposium on Algorithms, LNCS 4168, 2006, pp.

```javascript
const CountingBloomFilter = require('bloom-filters').CountingBloomFilter;

// create a Bloom Filter with capacity = 15 and 1% error rate
let filter = new CountingBloomFilter(15, 0.1);

// alternatively, create a Counting Bloom Filter from an array with 1% error rate
filter = CountingBloomFilter.from([ 'alice', 'bob' ], 0.1);
// add some value in the filter
filter.add('alice');
filter.add('bob');
filter.add('carole');

// remove some value
filter.remove('carole');

// lookup for some data
console.log(filter.has('bob')); // output: true
console.log(filter.has('carole')); // output: false
console.log(filter.has('daniel')); // output: false

// print false positive rate (around 0.1)
console.log(filter.rate());
```

### Count Min Sketch

The Count Min Sketch (CM sketch) is a probabilistic data structure that serves as a frequency table of events in a stream of data.
It uses hash functions to map events to frequencies, but unlike a hash table uses only sub-linear space, at the expense of overcounting some events due to collisions.

**Reference:** Cormode, G., & Muthukrishnan, S. (2005). *An improved data stream summary: the count-min sketch and its applications.* Journal of Algorithms, 55(1), 58-75.
([Full text article](http://vaffanculo.twiki.di.uniroma1.it/pub/Ing_algo/WebHome/p14_Cormode_JAl_05.pdf))

```javascript
const { CountMinSketch } = require('bloom-filters')

// create a new count min sketch with epsilon = 0.001 and delta = 0.99
const sketch = new CountMinSketch(0.001, 0.99)

// push some occurrences in the sketch
sketch.update('alice')
sketch.update('alice')
sketch.update('bob')

// count occurrences
console.log(sketch.count('alice')) // output: 2
console.log(sketch.count('bob')) // output: 1
console.log(sketch.count('daniel')) // output: 0
```

### Invertible Bloom Filters

An Invertible Bloom Lookup Table is a space-efficient and probabilistic data-structure for solving the set-difference problem efficiently without the use of logs or other prior context. It computes the set difference with communication proportional to the size of the difference between the sets being compared.
They can simultaneously calculate D(A−B) and D(B−A) using O(d) space. This data structure encodes sets in a fashion that is similar in spirit to Tornado codes’ construction, in that it randomly combines elements using the XOR function.

**Reference:** Eppstein, D., Goodrich, M. T., Uyeda, F., & Varghese, G. (2011). *What's the difference?: efficient set reconciliation without prior context.* ACM SIGCOMM Computer Communication Review, 41(4), 218-229. [full-text article](http://www.sysnet.ucsd.edu/sysnet/miscpapers/EppGooUye-SIGCOMM-11.pdf)

**Inputs:** Only Accept Buffer (node: `require('buffer')` or browser `require('buffer/').Buffer`) as input

**Methods:**
Please respects the method inputs and don't pass JSON exported structures as inputs. Import them before.

* `add(element: Buffer) -> void`: add an element into the IBLT
* `delete(element: Buffer) -> void`: delete an element from the IBLT
* `has(element: Buffer) -> true|false|'perhaps'`: return whether an element is in the IBLT or not, or perhaphs in
* `substract(remote: InvertibleBloomFilter)`: this IBLT subtracted from remote, return another IBLT
* `static InvertibleBloomFilter.decode(subtracted: InvertibleBloomFilter) -> {additional: Buffer[], missing: Buffer[]} `: decode a subtracted IBLT
* `listEntries() -> {success: true|false, output: Buffer[]}`: list all entries in the IBLT
* getters:
  * `length`: return the number of elements inserted, iterate on all count variables of all cells and return the average (sum/size)
  * `size`: return the number of cells
  * `hashCount`: return the number of times an element is hashed into the structure
  * `elements`: return an array of all cells

```javascript
const { InvertibleBloomFilter } = require('bloom-filters')

// IF YOU ARE NODEJS user no need to import Buffer
// or IF YOU ARE a BROWSER-BASED USER, you must import the package buffer (https://www.npmjs.com/package/buffer)

const hashcount = 3
const size = 50
const iblt = new InvertibleBloomFilter(size, hashcount)
const remote = new InvertibleBloomFilter(size, hashcount)

// push some data in the iblt
const data = [Buffer.from('alice'),
  Buffer.from(JSON.stringify(42)),
  Buffer.from('help'),
  Buffer.from('meow'),
  Buffer.from('json')]

data.forEach(e => iblt.add(e))

const remoteData = [Buffer.from('alice'),
  Buffer.from('car'),
  Buffer.from('meow'),
  Buffer.from('help')]

remoteData.forEach(e => remote.add(e))

const sub = iblt.substract(remote)
const result = InvertibleBloomFilter.decode(sub)
console.log('Did we successfully decode the subtracted iblts?', result.success, result.reason)
console.log('Missing elements for iblt: ', result.missing, result.missing.map(e => e.toString()))
console.log('Additional elements of iblt and missing elements of the remote iblt: ', result.additional, result.additional.map(e => e.toString()))
// create the iblt like before
console.log('Verify if Buffer.from("help") is in the iblt: ', iblt.has(Buffer.from('help')))
// true with high probability if well configured

iblt.delete(Buffer.from('help'))
// no error ;)

console.log('Deleting Buffer.from("help") and rechecking:', iblt.has(Buffer.from('help')))

const list = iblt.listEntries()
console.log('Remaining entries after deletion: ', list.success, list.output.map(e => e.toString()))

```
The example can be run in tests/iblt-example.js

**Tuning the IBLT** We recommend to use at least a **hashcount** of 3 and an **alpha** of 1.5 for at least 50 differences which equals to 1.5*50 = 75 cells. Then if you insert a huge number of values in there. The decoding will work (whatever the number of differences less than 50) but testing the presence of a value is still probabilistic on the number of elements  inserted. Even for the listEntries function. For more details we suggest you to read the paper ([full-text article](http://www.sysnet.ucsd.edu/sysnet/miscpapers/EppGooUye-SIGCOMM-11.pdf)).

## Export and import

All data structures exposed by this package can be **exported and imported to/from JSON**:

* Use the method `saveAsJSON()` to export any data structures into a JSON object.
* Use the static method `fromJSON(json)` to load a data structure from a JSON object.

```javascript
const { BloomFilter } = require('bloom-filters')

const filter = new BloomFilter(15, 0.01)
filter.add('alice')

// export a bloom filter to JSON
const exported = filter.saveAsJSON()

// do something with the JSON object (save it as file, send it to a server, etc)
// ...

// import the same filter from its JSON export
const importedFilter = BloomFilter.fromJSON(exported)
console.log(filter.has('alice')) // output: true
console.log(filter.has('bob')) // output: false
```

## Every hash function is seeded

By default every hash function is seeded with an internal seed which is equal to `0x1234567890`. If you want to change it:

```javascript
const BloomFilter = require('bloom-filter')
const bl = new BloomFilter.MyBloomFilter(...)
console.log(bl.seed) // 78187493520
bl.seed = 0xABCD
console.log(bl.seed) // 43981
```

## Documentation

See [documentation online](https://callidon.github.io/bloom-filters/) or generate it in directory `doc/` with: `npm run doc`

## Tests

Running with Mocha + Chai
```bash
# run tests
npm test

# generate coverage with istanbul
npm run coverage
```

## References

* [Classic Bloom Filter](http://crystal.uta.edu/~mcguigan/cse6350/papers/Bloom.pdf): Bloom, B. H. (1970). *Space/time trade-offs in hash coding with allowable errors.* Communications of the ACM, 13(7), 422-426.
* [Partitioned Bloom Filter](http://citeseerx.ist.psu.edu/viewdoc/download?doi=10.1.1.153.6902&rep=rep1&type=pdf): Chang, F., Feng, W. C., & Li, K. (2004, March). *Approximate caches for packet classification.* In INFOCOM 2004. Twenty-third AnnualJoint Conference of the IEEE Computer and Communications Societies (Vol. 4, pp. 2196-2207). IEEE.
* [Cuckoo Filter](https://www.cs.cmu.edu/~dga/papers/cuckoo-conext2014.pdf): Fan, B., Andersen, D. G., Kaminsky, M., & Mitzenmacher, M. D. (2014, December). *Cuckoo filter: Practically better than bloom.* In Proceedings of the 10th ACM International on Conference on emerging Networking Experiments and Technologies (pp. 75-88). ACM.
* [Counting Bloom Filter](http://www.eecs.harvard.edu/~michaelm/postscripts/esa2006b.pdf): F. Bonomi, M. Mitzenmacher, R. Panigrahy, S. Singh, and G. Varghese, *An Improved Construction for Counting Bloom Filters*, in 14th Annual European Symposium on Algorithms, LNCS 4168, 2006, pp.
* [Count Min Sketch](http://vaffanculo.twiki.di.uniroma1.it/pub/Ing_algo/WebHome/p14_Cormode_JAl_05.pdf): Cormode, G., & Muthukrishnan, S. (2005). *An improved data stream summary: the count-min sketch and its applications.* Journal of Algorithms, 55(1), 58-75.
* [Invertible Bloom Filters](http://www.sysnet.ucsd.edu/sysnet/miscpapers/EppGooUye-SIGCOMM-11.pdf): Eppstein, D., Goodrich, M. T., Uyeda, F., & Varghese, G. (2011). *What's the difference?: efficient set reconciliation without prior context.* ACM SIGCOMM Computer Communication Review, 41(4), 218-229.

## Changelog

**v0.7.1**: Add the Counting Bloom Filter.

**v0.7.0** Move to [XXHASH](https://cyan4973.github.io/xxHash/) for hashing elements in the library. One property has been added into the exported json `_seed` which is used to seed every hash of every elements. Update Invertible Bloom Filters with #add, #has, #delete, #listEntries, #substract, #Static.decode methods. Updated the way to get distinct indices which could have collisions in many cases.

**v0.6.1** Add Invertible Bloom Filters (only #encode/#substract/#Static.decode methods)

## License
[MIT License](https://github.com/Callidon/bloom-filters/blob/master/LICENSE)
