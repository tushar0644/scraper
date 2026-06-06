document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements - Sidebar & Nav
  const sidebar = document.getElementById('sidebar');
  const burgerToggle = document.getElementById('burgerToggle');
  const sidebarOverlay = document.getElementById('sidebarOverlay');
  const accordionToggleBtn = document.getElementById('accordionToggleBtn');
  const finaleAccordion = document.getElementById('finaleAccordion');
  const menuLinks = document.querySelectorAll('.menu-link[data-page]');
  const pageSections = document.querySelectorAll('.page-section');

  // Static Cities Array
  const cities = [
    "Delhi", "Mumbai", "Bangalore", "Pune", 
    "Kolkata", "Hyderabad", "Chennai", "Jaipur", 
    "Ahmedabad", "Surat", "Lucknow", "Chandigarh"
  ];

  // Client-Side Registrations State (Empty Initially)
  let registrations = [];
  let currentSortField = "";
  let isSortAsc = true;

  // --- Future Login Tracking fields structure (Stored internally for database/admin integration later) ---
  const futureLoginTrackingSchema = {
    mobileNumber: String, // e.g. "+91 87662 47447"
    otpVerified: Boolean,  // e.g. true
    loginStatus: String,  // e.g. "Active", "Inactive"
    loginTime: Date,      // e.g. 2026-06-06T15:25:32.000Z
    lastActive: Date,     // e.g. 2026-06-06T15:42:26.000Z
    deviceInfo: String    // e.g. "Chrome 125.0 - Windows 11"
  };

  // 1. Mobile Sidebar Toggle Functionality
  const toggleMobileSidebar = () => {
    document.body.classList.toggle('sidebar-open');
  };

  const closeMobileSidebar = () => {
    document.body.classList.remove('sidebar-open');
  };

  burgerToggle.addEventListener('click', toggleMobileSidebar);
  sidebarOverlay.addEventListener('click', closeMobileSidebar);

  // 2. Accordion Expand/Collapse Functionality
  finaleAccordion.classList.add('expanded');

  accordionToggleBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    finaleAccordion.classList.toggle('expanded');
  });

  // 3. SPA Routing & Link Highlights
  menuLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      
      const targetPageId = link.getAttribute('data-page');
      const targetSection = document.getElementById(`page-${targetPageId}`);
      
      if (!targetSection) return;

      // Update active link state
      menuLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');

      // Update visible page section
      pageSections.forEach(section => {
        section.classList.remove('active');
      });
      targetSection.classList.add('active');

      // Auto-expand accordion if clicking a submenu item
      const isSubmenuItem = link.closest('.submenu');
      if (isSubmenuItem) {
        finaleAccordion.classList.add('expanded');
      }

      // Smooth scroll back to top of main wrapper when swapping tabs
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // Close mobile drawer after page selection
      closeMobileSidebar();
    });
  });

  // --- Searchable Dropdown Helper Function ---
  function initSearchableSelect(containerId, options, placeholderText = "Select City") {
    const container = document.getElementById(containerId);
    if (!container) return null;
    
    const trigger = container.querySelector('.select-trigger');
    const dropdown = container.querySelector('.select-dropdown');
    const searchInput = container.querySelector('.select-search-input');
    const optionsList = container.querySelector('.select-options-list');
    const hiddenInput = container.querySelector('input[type="hidden"]');
    
    let selectedValue = "";

    const renderOptions = (filterText = "") => {
      optionsList.innerHTML = "";
      const filtered = options.filter(opt => 
        opt.toLowerCase().includes(filterText.toLowerCase())
      );
      
      if (filtered.length === 0) {
        optionsList.innerHTML = `<li class="select-no-results">No results found</li>`;
        return;
      }

      filtered.forEach(opt => {
        const li = document.createElement('li');
        li.className = `select-option ${opt === selectedValue ? 'selected' : ''}`;
        li.textContent = opt;
        
        li.addEventListener('click', (e) => {
          e.stopPropagation();
          selectedValue = opt;
          trigger.textContent = opt;
          hiddenInput.value = opt;
          
          const changeEvent = new Event('change', { bubbles: true });
          hiddenInput.dispatchEvent(changeEvent);
          
          container.classList.remove('open');
        });
        
        optionsList.appendChild(li);
      });
    };

    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      
      document.querySelectorAll('.searchable-select').forEach(sel => {
        if (sel !== container) sel.classList.remove('open');
      });
      
      container.classList.toggle('open');
      if (container.classList.contains('open')) {
        searchInput.value = "";
        searchInput.focus();
        renderOptions("");
      }
    });

    searchInput.addEventListener('input', () => {
      renderOptions(searchInput.value);
    });

    document.addEventListener('click', (e) => {
      if (!container.contains(e.target)) {
        container.classList.remove('open');
      }
    });

    renderOptions("");

    return {
      reset: () => {
        selectedValue = "";
        trigger.textContent = placeholderText;
        hiddenInput.value = "";
        searchInput.value = "";
        renderOptions("");
      },
      setValue: (val) => {
        selectedValue = val;
        trigger.textContent = val || placeholderText;
        hiddenInput.value = val;
        renderOptions("");
      },
      getValue: () => selectedValue
    };
  }

  // Initialize City Dropdowns
  const filterCityDropdown = initSearchableSelect('cityFilter', cities, "Select City");
  const modalCityDropdown = initSearchableSelect('cityModal', cities, "Select City");

  // --- Age and DOB Automatic Calculation ---
  const calculateAge = (dobString) => {
    if (!dobString) return null;
    const birthDate = new Date(dobString);
    const today = new Date();
    
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // DOB Event Listener on Add Registration Form
  const addDobInput = document.getElementById('addDob');
  const addAgeInput = document.getElementById('addAge');
  const ageValidationError = document.getElementById('ageValidationError');
  const submitModalBtn = document.getElementById('submitModalBtn');

  addDobInput.addEventListener('change', () => {
    const dob = addDobInput.value;
    const age = calculateAge(dob);

    if (age === null || isNaN(age)) {
      addAgeInput.value = "";
      ageValidationError.style.display = 'none';
      addAgeInput.classList.remove('error');
      addDobInput.classList.remove('error');
      submitModalBtn.disabled = false;
      return;
    }

    addAgeInput.value = age;

    // Range Check Validation (18 to 36 years)
    if (age < 18 || age > 36) {
      ageValidationError.style.display = 'flex';
      addAgeInput.classList.add('error');
      addDobInput.classList.add('error');
      submitModalBtn.disabled = true;
    } else {
      ageValidationError.style.display = 'none';
      addAgeInput.classList.remove('error');
      addDobInput.classList.remove('error');
      submitModalBtn.disabled = false;
    }
  });

  // --- Modal Toggle Controls ---
  const addModalOverlay = document.getElementById('addModalOverlay');
  const openAddModalBtn = document.getElementById('openAddModalBtn');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const cancelModalBtn = document.getElementById('cancelModalBtn');
  const addRegistrationForm = document.getElementById('addRegistrationForm');

  const openModal = () => {
    addRegistrationForm.reset();
    if (modalCityDropdown) {
      modalCityDropdown.reset();
    }
    addAgeInput.value = "";
    ageValidationError.style.display = 'none';
    addAgeInput.classList.remove('error');
    addDobInput.classList.remove('error');
    submitModalBtn.disabled = false;
    addModalOverlay.classList.add('open');
  };

  const closeModal = () => {
    addModalOverlay.classList.remove('open');
  };

  openAddModalBtn.addEventListener('click', openModal);
  closeModalBtn.addEventListener('click', closeModal);
  cancelModalBtn.addEventListener('click', closeModal);

  addModalOverlay.addEventListener('click', (e) => {
    if (e.target === addModalOverlay) {
      closeModal();
    }
  });

  // --- Render Table Results ---
  const tableBody = document.getElementById('tableBodyRegistrations');
  const emptyState = document.getElementById('emptyStateRegistrations');
  const totalCountLabel = document.getElementById('totalRegistrationsCount');
  const paginationText = document.getElementById('paginationText');

  const renderTable = (data) => {
    tableBody.innerHTML = "";
    
    if (data.length === 0) {
      emptyState.style.display = "flex";
      totalCountLabel.textContent = "0";
      paginationText.textContent = "Showing 0 to 0 of 0 entries";
      return;
    }

    emptyState.style.display = "none";
    totalCountLabel.textContent = registrations.length;

    data.forEach((reg) => {
      const tr = document.createElement('tr');
      
      tr.innerHTML = `
        <td>${reg.no}</td>
        <td>${reg.gender}</td>
        <td style="font-weight: 600;">${reg.name}</td>
        <td>
          <a href="${reg.igLink}" target="_blank" style="color: var(--primary); text-decoration: none; display: inline-flex; align-items: center; gap: 4px;">
            Instagram Link
            <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="2" fill="none"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
          </a>
        </td>
        <td>${reg.city}</td>
        <td>${reg.dobFormatted}</td>
        <td>${reg.age}</td>
        <td>
          <button class="btn-delete" style="background: none; border: none; cursor: pointer; color: var(--danger); padding: 4px; display: inline-flex; border-radius: var(--border-radius-sm);" title="Delete Registration" data-no="${reg.no}">
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
          </button>
        </td>
      `;
      
      tableBody.appendChild(tr);
    });

    const deleteButtons = tableBody.querySelectorAll('.btn-delete');
    deleteButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const no = parseInt(btn.getAttribute('data-no'));
        registrations = registrations.filter(r => r.no !== no);
        
        registrations.forEach((r, idx) => {
          r.no = idx + 1;
        });

        applyFilters();
      });
    });

    paginationText.textContent = `Showing 1 to ${data.length} of ${data.length} entries`;
  };

  // --- Add Registration Submission ---
  addRegistrationForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('addName').value.trim();
    const phone = document.getElementById('addPhone').value.trim();
    const gender = document.getElementById('addGender').value;
    const igLink = document.getElementById('addIgLink').value.trim();
    const city = document.getElementById('cityModalValue').value;
    const dob = addDobInput.value;
    const age = parseInt(addAgeInput.value);

    // DOB age constraint
    if (!dob || isNaN(age) || age < 18 || age > 36) {
      ageValidationError.style.display = 'flex';
      return;
    }

    if (!city) {
      alert("Please select a city.");
      return;
    }

    const dobDate = new Date(dob);
    const day = String(dobDate.getDate()).padStart(2, '0');
    const month = String(dobDate.getMonth() + 1).padStart(2, '0');
    const year = dobDate.getFullYear();
    const dobFormatted = `${day}/${month}/${year}`;

    const newRecord = {
      no: registrations.length + 1,
      gender,
      name,
      phone,
      igLink,
      city,
      dob,
      dobFormatted,
      age
    };

    registrations.push(newRecord);
    
    filterForm.reset();
    if (filterCityDropdown) {
      filterCityDropdown.reset();
    }
    
    renderTable(registrations);
    closeModal();
  });

  // --- Table Filtering Logic ---
  const filterForm = document.getElementById('filterForm');
  const filterFromDate = document.getElementById('filterFromDate');
  const filterToDate = document.getElementById('filterToDate');
  const filterGender = document.getElementById('filterGender');
  const filterMinAge = document.getElementById('filterMinAge');
  const filterMaxAge = document.getElementById('filterMaxAge');
  const filterSearchName = document.getElementById('filterSearchName');
  const filterAgeValidationError = document.getElementById('filterAgeValidationError');

  const applyFilters = () => {
    const fromDateVal = filterFromDate.value;
    const toDateVal = filterToDate.value;
    const genderVal = filterGender.value;
    const cityVal = document.getElementById('cityFilterValue').value;
    const minAgeVal = filterMinAge.value ? parseInt(filterMinAge.value) : null;
    const maxAgeVal = filterMaxAge.value ? parseInt(filterMaxAge.value) : null;
    const searchNameVal = filterSearchName.value.trim().toLowerCase();

    // Min / Max Age range check
    let hasAgeError = false;
    if (minAgeVal !== null && (minAgeVal < 18 || minAgeVal > 36)) hasAgeError = true;
    if (maxAgeVal !== null && (maxAgeVal < 18 || maxAgeVal > 36)) hasAgeError = true;
    if (minAgeVal !== null && maxAgeVal !== null && minAgeVal > maxAgeVal) hasAgeError = true;

    if (hasAgeError) {
      filterAgeValidationError.style.display = 'flex';
      filterMinAge.classList.add('error');
      filterMaxAge.classList.add('error');
      return false;
    } else {
      filterAgeValidationError.style.display = 'none';
      filterMinAge.classList.remove('error');
      filterMaxAge.classList.remove('error');
    }

    const filtered = registrations.filter(reg => {
      if (fromDateVal) {
        const regDate = new Date(reg.dob);
        const fromDate = new Date(fromDateVal);
        if (regDate < fromDate) return false;
      }
      if (toDateVal) {
        const regDate = new Date(reg.dob);
        const toDate = new Date(toDateVal);
        if (regDate > toDate) return false;
      }

      if (genderVal && reg.gender !== genderVal) return false;
      if (cityVal && reg.city !== cityVal) return false;
      if (minAgeVal !== null && reg.age < minAgeVal) return false;
      if (maxAgeVal !== null && reg.age > maxAgeVal) return false;
      if (searchNameVal && !reg.name.toLowerCase().includes(searchNameVal)) return false;

      return true;
    });

    renderTable(filtered);
    return true;
  };

  filterForm.addEventListener('submit', (e) => {
    e.preventDefault();
    applyFilters();
  });

  // --- Export Excel Toast ---
  const exportExcelBtn = document.getElementById('exportExcelBtn');
  if (exportExcelBtn) {
    exportExcelBtn.addEventListener('click', () => {
      alert("Export Excel Action: Starting download for registrations_list.xlsx... (Mock action initialized)");
    });
  }

  // --- Export Login Analytics Excel Toast ---
  const exportLoginExcelBtn = document.getElementById('exportLoginExcelBtn');
  if (exportLoginExcelBtn) {
    exportLoginExcelBtn.addEventListener('click', () => {
      alert("Export Login Logs Action: Starting download for user_login_log.xlsx... (Mock action initialized)");
    });
  }

  // --- Dynamic Table Sorting ---
  const headers = document.querySelectorAll('#registrationsTable th.sortable-header');
  headers.forEach(header => {
    header.addEventListener('click', () => {
      const field = header.getAttribute('data-sort');
      
      if (currentSortField === field) {
        isSortAsc = !isSortAsc;
      } else {
        currentSortField = field;
        isSortAsc = true;
      }

      headers.forEach(h => {
        const indicator = h.querySelector('.sort-indicator');
        indicator.textContent = "⇅";
      });

      const indicator = header.querySelector('.sort-indicator');
      indicator.textContent = isSortAsc ? "▲" : "▼";

      registrations.sort((a, b) => {
        let valA = a[field];
        let valB = b[field];

        if (field === 'no' || field === 'age') {
          valA = parseInt(valA);
          valB = parseInt(valB);
        } else if (field === 'dob') {
          valA = new Date(a.dob);
          valB = new Date(b.dob);
        } else {
          valA = String(valA).toLowerCase();
          valB = String(valB).toLowerCase();
        }

        if (valA < valB) return isSortAsc ? -1 : 1;
        if (valA > valB) return isSortAsc ? 1 : -1;
        return 0;
      });

      applyFilters();
    });
  });

  // Initial table render
  renderTable(registrations);
});
