const { readdir, stat } = require('fs/promises');
const { join } = require('path');

const dirSize = async dir => {
  const files = await readdir(dir, { withFileTypes: true });
  const paths = files.map( async file => {
    const path = join(dir, file.name);
    if (file.isDirectory()) return await dirSize(path);
    if (file.isFile()) {
      const { size } = await stat(path); 
      return size;
    }
    return 0;
  });
  return(await Promise.all(paths)).flat(Infinity).reduce((i, size) => i + size, 0);
}
(async () => {
    const size = await dirSize('/Volumes/New Volume 2/New folder');
    console.log( size );
})();