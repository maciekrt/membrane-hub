
function zeroFilled(n) {
    return ('00' + n).slice(-2)
};

export class Dims {
    constructor(dims) {
        this.dims = dims;
        (this.state = []).length = dims.length;
        this.state.fill(0);
    }

    levels() {
        var nums = Array.from(Array(this.dims[0]).keys())
        return nums.map((n) => zeroFilled(n))
    }
};