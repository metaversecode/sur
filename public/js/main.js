document.addEventListener('DOMContentLoaded', () => {
  // ── Drop Zone (Upload Page) ────────────────────────────
  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('photo-input');
  const previewsContainer = document.getElementById('photo-previews');

  if (dropZone && fileInput && previewsContainer) {
    // Click to browse
    dropZone.addEventListener('click', () => fileInput.click());

    // Drag events
    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', (e) => {
      e.preventDefault();
      dropZone.classList.remove('dragover');
    });

    // Drop files
    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('dragover');

      // Transfer dropped files to the file input
      const dt = new DataTransfer();
      for (const file of e.dataTransfer.files) {
        if (file.type.startsWith('image/')) {
          dt.items.add(file);
        }
      }
      fileInput.files = dt.files;
      renderPreviews(fileInput.files);
    });

    // File input change
    fileInput.addEventListener('change', () => {
      renderPreviews(fileInput.files);
    });
  }

  function renderPreviews(files) {
    if (!previewsContainer) return;
    previewsContainer.innerHTML = '';

    Array.from(files).forEach((file, index) => {
      if (!file.type.startsWith('image/')) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const item = document.createElement('div');
        item.className = 'preview-item';
        item.innerHTML = `
          <img src="${e.target.result}" alt="Preview ${index + 1}">
          <button type="button" class="preview-remove" data-index="${index}" title="Remove">✕</button>
        `;
        previewsContainer.appendChild(item);

        // Remove individual photo
        item.querySelector('.preview-remove').addEventListener('click', (ev) => {
          ev.stopPropagation();
          const dt = new DataTransfer();
          Array.from(fileInput.files).forEach((f, i) => {
            if (i !== index) dt.items.add(f);
          });
          fileInput.files = dt.files;
          renderPreviews(fileInput.files);
        });
      };
      reader.readAsDataURL(file);
    });
  }

  // ── Lightbox (Person Detail Page) ──────────────────────
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxClose = document.getElementById('lightbox-close');

  if (lightbox && lightboxImg) {
    document.querySelectorAll('.gallery-item').forEach((item) => {
      item.addEventListener('click', () => {
        const img = item.querySelector('img');
        if (img) {
          lightboxImg.src = img.src;
          lightboxImg.alt = img.alt;
          lightbox.classList.add('active');
          document.body.style.overflow = 'hidden';
        }
      });
    });

    const closeLightbox = () => {
      lightbox.classList.remove('active');
      document.body.style.overflow = '';
    };

    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) closeLightbox();
    });

    if (lightboxClose) {
      lightboxClose.addEventListener('click', closeLightbox);
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeLightbox();
    });
  }

  // ── Sidebar Toggle ─────────────────────────────────────
  const menuToggle = document.getElementById('menu-toggle');
  const sidebar = document.getElementById('sidebar');
  const sidebarOverlay = document.getElementById('sidebar-overlay');
  const sidebarClose = document.getElementById('sidebar-close');

  function openSidebar() {
    sidebar?.classList.add('active');
    sidebarOverlay?.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeSidebar() {
    sidebar?.classList.remove('active');
    sidebarOverlay?.classList.remove('active');
    document.body.style.overflow = '';
  }

  if (menuToggle) menuToggle.addEventListener('click', openSidebar);
  if (sidebarClose) sidebarClose.addEventListener('click', closeSidebar);
  if (sidebarOverlay) sidebarOverlay.addEventListener('click', closeSidebar);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sidebar?.classList.contains('active')) {
      closeSidebar();
    }
  });

  // ── Search Form Loading ────────────────────────────────
  const searchForm = document.getElementById('search-form');
  if (searchForm) {
    searchForm.addEventListener('submit', (e) => {
      const input = searchForm.querySelector('.search-input');
      if (!input.value.trim()) {
        e.preventDefault();
        input.focus();
        return;
      }
      const btn = searchForm.querySelector('.search-submit');
      if (btn) {
        btn.innerHTML = '<div class="spinner"></div>';
        btn.disabled = true;
      }
    });
  }

  // ── Upload Form Loading ────────────────────────────────
  const uploadForm = document.getElementById('upload-form');
  if (uploadForm) {
    uploadForm.addEventListener('submit', (e) => {
      const nameInput = document.getElementById('name-input');
      if (!nameInput || !nameInput.value.trim()) {
        e.preventDefault();
        if (nameInput) nameInput.focus();
        return;
      }

      if (!fileInput || fileInput.files.length === 0) {
        e.preventDefault();
        if (dropZone) {
          dropZone.style.borderColor = '#f87171';
          setTimeout(() => {
            dropZone.style.borderColor = '';
          }, 2000);
        }
        return;
      }

      const btn = document.getElementById('submit-btn');
      if (btn) {
        btn.innerHTML = '<div class="spinner"></div> Uploading...';
        btn.disabled = true;
      }
    });
  }

  // ── Staggered card animations ──────────────────────────
  document.querySelectorAll('.person-card').forEach((card, i) => {
    card.style.animationDelay = `${i * 0.06}s`;
  });
});
