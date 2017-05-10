exports.toBeApprox = function () {
  return {
    compare: function (actual, expected) {
      const result = {};
      result.pass = Math.abs(actual.real() - expected.real()) < 0.0001 &&
        Math.abs(actual.imaginary() - expected.imaginary()) < 0.0001;
      return result;
    }
  }
};

exports.toEql = function () {
  var arraysAreEql = function (a1, a2) {
    var i;
    if (!(a2 instanceof Array)) return false;
    if (a1.length !== a2.length) return false;
    for (i in a1) {
      if (!a1[i].eql(a2[i])) return false;
    }
    for (i in a2) {
      if (!a1[i].eql(a2[i])) return false;
    }
    return true;
  };

  return {
    compare: function (actual, expected) {
      const result = {};
      if (actual === expected) {
        result.pass = true;
      } else if (actual instanceof Array) {
        result.pass = arraysAreEql(actual, expected);
      } else {
        result.pass = actual.eql(expected);
      }
      return result;
    }
  };
};
