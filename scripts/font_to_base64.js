// This scripts converts font awesome woff font into base64 string.
// Then outputs as a variable in a SASS file.
// Takes 2 positional arguments: input filepath, output filepath.


fs = require('fs')
base64 = require('base-64')


// Get input and output filepaths as arguments.
const ARGS = process.argv.slice(2);
const INPUT_FILEPATH = ARGS[0];
const OUTPUT_FILEPATH = ARGS[1];


// Open the font file as binary.
fs.readFile(INPUT_FILEPATH, 'binary', (err, data) => {
  if (err) { throw err }

  // Encode binary into base64 string.
  const encodedData = base64.encode(data);

  // SASS variable.
  const sassFileString = `$base64fontString: "${encodedData}" \n`

  // Write text into a SASS file.
  fs.writeFile(OUTPUT_FILEPATH, sassFileString, (err) => {
    if (err) { throw err }
  });
});
