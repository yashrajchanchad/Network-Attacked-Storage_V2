document.addEventListener('DOMContentLoaded', () => {

  const userLoggedIn = sessionStorage.getItem('nas-token');
  const userRole = sessionStorage.getItem('nas-role');
  
  const uploadForm = document.getElementById('uploadForm');
  const folderUploadForm = document.getElementById('folderUploadForm');
  const createFolderForm = document.getElementById('createFolderForm');
  const fileInput = document.getElementById('fileInput');
  const folderInput = document.getElementById('folderInput');
  const folderNameInput = document.getElementById('folderNameInput');
  const fileList = document.getElementById('fileList');
  const backButton = document.getElementById('backButton');
  const breadcrumb = document.getElementById('breadcrumb');
  const detailsPanel = document.getElementById('detailsPanel');
  const storagePanel = document.createElement('div');

  const dashboardBtn = document.getElementById('dashboard-btn');
  
  let currentPath = '/';
  let selectedElement = null;
  
  // Fetch and display storage details
  function loadStorageDetails() {
    fetch('/storage-details')
      .then(response => response.json())
      .then(data => {
        const path = data.diskPath.split("/");
        const newData = {
          module: path[path.length - 1],
          size: formatFileSize(data.size),
          free: formatFileSize(data.free),
        }
        const usedPr = (parseFloat(newData.free) / parseFloat(newData.size)) * 100;
        detailsPanel.innerHTML = `
          <h3>Storage Details</h3>
          <h4>Drive: ${newData.module}</h4>
          <p><strong>Total Space:</strong> ${newData.size}</p>
          <p><strong>Free Space:</strong> ${newData.free}</p>
          <div class="storage-capacity">
            <div class="ocupancy" style="width: ${100 - usedPr}%"></div>
            <div class="full" style="width: ${usedPr}%"></div>
          </div>
        `;
      })
      .catch(error => console.error('Error:', error));
  }

  uploadForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('path', currentPath);
    for (const file of fileInput.files) {
      formData.append('files', file, file.name);
    }

    fetch('/upload', {
      method: 'POST',
      body: formData
    })
      .then(response => response.text())
      .then(data => {
        alert(data);
        loadFiles();
      })
      .catch(error => console.error('Error:', error));
  });

  folderUploadForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('path', currentPath);
    for (const file of folderInput.files) {
      formData.append('files', file, file.webkitRelativePath);
    }

    fetch('/upload', {
      method: 'POST',
      body: formData
    })
      .then(response => response.text())
      .then(data => {
        alert(data);
        loadFiles();
      })
      .catch(error => console.error('Error:', error));
  });

  createFolderForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const folderName = folderNameInput.value.trim();
    if (folderName) {
      fetch('/create-folder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ path: currentPath, folderName: folderName })
      })
        .then(response => response.text())
        .then(data => {
          alert(data);
          loadFiles();
        })
        .catch(error => console.error('Error:', error));
    }
  });

  backButton.addEventListener('click', () => {
    const pathParts = currentPath.split('/').filter(Boolean);
    pathParts.pop();
    currentPath = pathParts.join('/');
    loadFiles();
  });

  dashboardBtn.addEventListener('click', () => {
    if(userRole === 'admin') window.location.href = '/admin/dashboard.html';
  })
  
  function loadFiles() {
    fetch(`/files?path=${encodeURIComponent(currentPath)}`)
      .then(response => response.json())
      .then(files => {
        fileList.innerHTML = '';
        files.forEach(file => {
          const listItem = document.createElement('li');
          listItem.className = 'file-item';

          const fileNameSpan = document.createElement('span');
          fileNameSpan.textContent = file.name;
          fileNameSpan.style.cursor = 'pointer';

          listItem.onclick = () => {
            if (selectedElement) {
              selectedElement.classList.remove('selected');
            }
            listItem.classList.add('selected');
            selectedElement = listItem;
            if (currentPath === '/') {
              loadStorageDetails();
            }
            else {
              showDetails(file.path);
            }
          };

          listItem.ondblclick = () => {
            if (file.type === 'directory') {
              currentPath = file.path;
              loadFiles();
            } else {
              viewFile(file.path);
            }
          };

          const fileIcon = document.createElement('img');
          fileIcon.src = file.type === 'directory' ? 'folder-icon.png' : 'file-icon.png';
          fileIcon.alt = file.type;
          fileIcon.className = file.type === 'directory' ? 'folder' : 'file';

          listItem.appendChild(fileIcon);
          listItem.appendChild(fileNameSpan);

          const deleteButton = document.createElement('button');
          deleteButton.textContent = 'Delete';
          deleteButton.onclick = (e) => {
            e.stopPropagation();
            deleteFile(file.path);
          };

          const renameButton = document.createElement('button');
          renameButton.textContent = 'Rename';
          renameButton.onclick = (e) => {
            e.stopPropagation();
            renameFile(file.path);
          };

          const downloadButton = document.createElement('button');
          downloadButton.textContent = 'Download';
          downloadButton.onclick = (e) => {
            e.stopPropagation();
            downloadFile(file.path);
          };

          listItem.appendChild(deleteButton);
          listItem.appendChild(renameButton);
          listItem.appendChild(downloadButton);

          fileList.appendChild(listItem);
        });

        backButton.style.display = currentPath ? 'block' : 'none';
        updateBreadcrumb();
        if (currentPath === '/') {
          loadStorageDetails();
        } else {
          storagePanel.innerHTML = '';
        }
      })
      .catch(error => console.error('Error:', error));
  }

  function updateBreadcrumb() {
    breadcrumb.innerHTML = '';

    const pathParts = currentPath.split('/').filter(Boolean);
    let fullPath = '';

    pathParts.forEach((part, index) => {
      fullPath += part + '/';

      const span = document.createElement('span');
      span.textContent = part;
      span.style.cursor = 'pointer';
      span.onclick = () => {
        currentPath = pathParts.slice(0, index + 1).join('/');
        loadFiles();
      };

      breadcrumb.appendChild(span);
      if (index < pathParts.length - 1) {
        breadcrumb.appendChild(document.createTextNode(' / '));
      }
    });

    if (currentPath) {
      const rootSpan = document.createElement('span');
      rootSpan.textContent = 'Root';
      rootSpan.style.cursor = 'pointer';
      rootSpan.onclick = () => {
        currentPath = '';
        loadFiles();
      };

      breadcrumb.insertBefore(document.createTextNode(' / '), breadcrumb.firstChild);
      breadcrumb.insertBefore(rootSpan, breadcrumb.firstChild);
    }
  }

  function deleteFile(filePath) {
    fetch(`/files/${encodeURIComponent(filePath)}`, {
      method: 'DELETE'
    })
      .then(response => response.text())
      .then(data => {
        alert(data);
        loadFiles();
      })
      .catch(error => console.error('Error:', error));
  }

  function renameFile(filePath) {
    const newFilename = prompt('Enter new name:');
    if (newFilename) {
      fetch(`/files/${encodeURIComponent(filePath)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ newFilename: newFilename })
      })
        .then(response => response.text())
        .then(data => {
          alert(data);
          loadFiles();
        })
        .catch(error => console.error('Error:', error));
    }
  }

  function viewFile(filePath) {
    const fileExt = filePath.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp'].includes(fileExt)) {
      const img = document.createElement('img');
      img.src = `/files/${encodeURIComponent(filePath)}`;
      img.style.maxWidth = '500px';
      img.style.maxHeight = '500px';

      const viewer = document.createElement('div');
      viewer.style.position = 'fixed';
      viewer.style.top = '50%';
      viewer.style.left = '50%';
      viewer.style.transform = 'translate(-50%, -50%)';
      viewer.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
      viewer.style.padding = '10px';
      viewer.style.borderRadius = '5px';
      viewer.style.zIndex = '1000';

      viewer.appendChild(img);

      const closeButton = document.createElement('button');
      closeButton.style.position = 'absolute';
      closeButton.style.top = '1rem';
      closeButton.style.right = '1rem';
      closeButton.textContent = 'X';
      closeButton.onclick = () => {
        document.body.removeChild(viewer);
      };

      const downloadButton = document.createElement('button');
      downloadButton.style.position = 'absolute';
      downloadButton.style.top = '3rem';
      downloadButton.style.right = '1rem';
      downloadButton.textContent = 'Download';
      downloadButton.onclick = () => {
        downloadFile(filePath);
      };

      viewer.appendChild(downloadButton);
      viewer.appendChild(closeButton);
      document.body.appendChild(viewer);
    } else {
      alert("File can not be visible!");
    }
  }

  function downloadFile(filePath) {
    const link = document.createElement('a');
    link.href = `/files/download/${encodeURIComponent(filePath)}`;
    link.download = filePath.split('/').pop();
    link.click();
  }

  function showDetails(filePath) {
    fetch(`/files/details/${encodeURIComponent(filePath)}`)
      .then(response => response.json())
      .then(details => {
        detailsPanel.innerHTML = `
      <h3>Details</h3>
      <p class="details-name"><strong>Name:</strong> ${details.name}</p>
      <p class="details-path"><strong>Path:</strong> ${details.path}</p>
      <p><strong>Type:</strong> ${details.type}</p>
      ${details.size ? `<p><strong>Size:</strong> ${formatFileSize(details.size)}</p>` : ''}
      ${details.lastModified ? `<p><strong>Last Modified:</strong> ${details.lastModified}</p>` : ''}
      `;
      })
      .catch(error => console.error('Error:', error));
  }

  function formatFileSize(bytes) {
    const units = ['bytes', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }

  if(userLoggedIn){
    loadFiles();
  }
  else{
    window.location.href = 'login.html';
  }
});
