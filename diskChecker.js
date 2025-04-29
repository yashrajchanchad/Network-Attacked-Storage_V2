const checkDiskSpace = require('check-disk-space').default;

// On Windows
checkDiskSpace('/Volumes').then((diskSpace) => {
    console.log(diskSpace);
});