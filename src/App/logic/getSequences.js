// Find sequences of numbers in the array of ints.
// Returns: [[1, 2], [4, 4], [6, 10]]

export default function getSequences(arr) {
    
    let beg, output = [];
    let min = Math.min(...arr), max = Math.max(...arr);
    
    for (let i = min; i <= max; i++) {
      // If no beginning value.
      if (!beg && arr.includes(i)) { beg = i }
      // If beginning value exists but i not in the array.
      if (beg && !arr.includes(i)) {
        output.push([beg, i - 1]);
        beg = null;
      }
      // If last item in the array.
      if (beg && arr.includes(i) && (i == max)) { output.push([beg, i]) }
    }
    return output;
  }