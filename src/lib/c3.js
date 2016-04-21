module.exports = class C3 {
  constructor(object) {
    this.object = object;
    this.map = new Map();
    this.map.set(object, []);
  }

  add(object, parent) {
    if (!this.map.has(parent)) {
      this.map.set(parent, []);
    }

    if (!this.map.has(object)) {
      this.map.set(object, []);
    }

    const parents = this.map.get(object);

    if (parents.indexOf(parent) >= 0) {
      throw new Error('Duplicate parent');
    }

    parents.push(parent);

    return this;
  }

  has(object) {
    return this.map.has(object);
  }

  run() {
    const map = new Map();

    this.map.forEach((parents, object) => {
      map.set(object, this.map.get(object).slice());
    });

    function notHead(l, c) {
      return l.some(s => s.indexOf(c) > 0);
    }

    function empty(s) {
      return s.length;
    }

    function merge(seqs) {
      const results = [];

      for (;;) {
        const nonEmptySeqs = seqs.filter(empty);
        let candidate;

        if (!nonEmptySeqs.length) {
          return results;
        }

        for (let i = 0; i < nonEmptySeqs.length; i++) {
          candidate = nonEmptySeqs[i][0];

          if (notHead(nonEmptySeqs, candidate)) {
            candidate = null;
          } else {
            break;
          }
        }

        if (!candidate) {
          throw new Error('Inconsistent hierarchy');
        }

        results.push(candidate);

        for (let i = 0; i < nonEmptySeqs.length; i++) {
          if (nonEmptySeqs[i][0] === candidate) {
            nonEmptySeqs[i].shift();
          }
        }
      }
    }

    function run(object) {
      return merge([[object]].concat(map.get(object).map(run)).concat([map.get(object)]));
    }

    return run(this.object);
  }
};
