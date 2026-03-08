const fs = require('fs');
const path = require('path');

const dist = path.join(__dirname, 'dist');
const toCopy = ['index.html', 'html', 'css', 'js', 'assets'];

// Function to recursively copy directories
function copyRecursiveSync(src, dest) {
    const exists = fs.existsSync(src);
    const stats = exists && fs.statSync(src);
    const isDirectory = exists && stats.isDirectory();
    if (isDirectory) {
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
        }
        fs.readdirSync(src).forEach((childItemName) => {
            copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
        });
    } else {
        fs.copyFileSync(src, dest);
    }
}

// Clean and create dist
if (fs.existsSync(dist)) {
    console.log('Cleaning existing dist directory...');
    fs.rmSync(dist, { recursive: true, force: true });
}
fs.mkdirSync(dist, { recursive: true });

// Copy files and folders
console.log('Copying files to dist...');
toCopy.forEach(item => {
    const src = path.join(__dirname, item);
    const dest = path.join(dist, item);
    if (fs.existsSync(src)) {
        copyRecursiveSync(src, dest);
        console.log(`- Copied ${item}`);
    } else {
        console.warn(`- Warning: ${item} not found`);
    }
});

console.log('Build complete!');
