document.addEventListener('DOMContentLoaded', () => {
  // --- DOM Elements ---
  const campaignForm = document.getElementById('campaignForm');
  const phoneInput = document.getElementById('phoneInput');
  const sendOtpBtn = document.getElementById('sendOtpBtn');
  const sendOtpText = document.getElementById('sendOtpText');
  const phoneVerifiedBadge = document.getElementById('phoneVerifiedBadge');
  const phoneInputError = document.getElementById('phoneInputError');
  
  const otpInputBlock = document.getElementById('otpInputBlock');
  const otpInput = document.getElementById('otpInput');
  const verifyOtpBtn = document.getElementById('verifyOtpBtn');
  const otpInputError = document.getElementById('otpInputError');
  
  const personalDetailsCard = document.getElementById('personalDetailsCard');
  const userName = document.getElementById('userName');
  const userNameError = document.getElementById('userNameError');
  const userDob = document.getElementById('userDob');
  const userDobError = document.getElementById('userDobError');
  const userGender = document.getElementById('userGender');
  const userGenderError = document.getElementById('userGenderError');
  const userCity = document.getElementById('userCity');
  const userCityError = document.getElementById('userCityError');
  
  const reelsLinksCard = document.getElementById('reelsLinksCard');
  const reelsList = document.getElementById('reelsList');
  const addReelBtn = document.getElementById('addReelBtn');
  
  const submitCard = document.getElementById('submitCard');
  const declarationCheck = document.getElementById('declarationCheck');
  const declarationError = document.getElementById('declarationError');
  const submitRegistrationBtn = document.getElementById('submitRegistrationBtn');

  // --- Dynamic DOB Boundaries Calculation (Age 18 - 36 years) ---
  const today = new Date();
  
  const maxDate = new Date(new Date().setFullYear(today.getFullYear() - 18)).toISOString().split("T")[0];
  const minDate = new Date(new Date().setFullYear(today.getFullYear() - 36)).toISOString().split("T")[0];
  
  userDob.max = maxDate;
  userDob.min = minDate;

  // Helper: Restrict inputs to numbers only
  const restrictToNumeric = (inputElement) => {
    inputElement.addEventListener('input', () => {
      inputElement.value = inputElement.value.replace(/[^0-9]/g, '');
    });
  };

  restrictToNumeric(phoneInput);
  restrictToNumeric(otpInput);

  // Toggle select text colors (gray color when placeholder select selected)
  userGender.addEventListener('change', () => {
    if (userGender.value) {
      userGender.classList.remove('empty');
    } else {
      userGender.classList.add('empty');
    }
  });

  // Helper: Calculate Age from DOB
  function calcAge(dobString) {
    if (!dobString) return 0;
    const birthDate = new Date(dobString);
    const todayDate = new Date();
    let age = todayDate.getFullYear() - birthDate.getFullYear();
    const m = todayDate.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && todayDate.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  // Helper: URL parsing for Instagram Reels
  function isValidReelUrl(url) {
    try {
      const parsed = new URL(url);
      return (
        (parsed.hostname === "www.instagram.com" || parsed.hostname === "instagram.com") &&
        parsed.pathname.includes("/reel/")
      );
    } catch {
      return false;
    }
  }

  // --- OTP Verification Logic ---
  let phoneVerified = false;
  let otpSent = false;

  // Listen to input changes in OTP input to enable/disable Verify button
  otpInput.addEventListener('input', () => {
    verifyOtpBtn.disabled = (otpInput.value.length !== 4);
  });

  // Send OTP
  sendOtpBtn.addEventListener('click', (e) => {
    e.preventDefault();
    phoneInputError.style.display = 'none';
    phoneInput.classList.remove('error');

    const phoneVal = phoneInput.value;

    if (phoneVal.length < 10) {
      phoneInput.classList.add('error');
      phoneInputError.textContent = "Enter a valid 10-digit phone number.";
      phoneInputError.style.display = 'block';
      return;
    }

    sendOtpBtn.classList.add('loading');
    sendOtpBtn.disabled = true;

    // Simulate backend sending delay
    setTimeout(() => {
      sendOtpBtn.classList.remove('loading');
      sendOtpBtn.disabled = false;
      sendOtpText.textContent = "Resend";
      
      otpInputBlock.style.display = 'block';
      otpInput.value = "";
      verifyOtpBtn.disabled = true;
      otpInput.focus();
      
      otpSent = true;
    }, 1200);
  });

  // Verify OTP
  verifyOtpBtn.addEventListener('click', (e) => {
    e.preventDefault();
    otpInputError.style.display = 'none';
    otpInput.classList.remove('error');

    verifyOtpBtn.classList.add('loading');
    verifyOtpBtn.disabled = true;

    setTimeout(() => {
      verifyOtpBtn.classList.remove('loading');
      verifyOtpBtn.disabled = false;

      if (otpInput.value === "1234") {
        // Success
        phoneVerified = true;
        
        // Update layouts
        otpInputBlock.style.display = 'none';
        sendOtpBtn.style.display = 'none';
        phoneVerifiedBadge.style.display = 'flex';
        phoneInput.disabled = true;
        
        // Unlock Form sections
        personalDetailsCard.classList.remove('form-locked');
        reelsLinksCard.classList.remove('form-locked');
        submitCard.classList.remove('form-locked');
        
        submitRegistrationBtn.disabled = false;
        
        // Focus user name input to guide user
        userName.focus();
      } else {
        otpInput.classList.add('error');
        otpInputError.textContent = "Invalid OTP. Please try again.";
        otpInputError.style.display = 'block';
      }
    }, 1200);
  });

  // --- Dynamic Reels Links Control List ---
  let reelIndexCounter = 1;

  // Add Reel URL row
  addReelBtn.addEventListener('click', () => {
    const row = document.createElement('div');
    row.className = 'reel-input-row';
    row.style.marginTop = '12px';
    row.setAttribute('data-index', reelIndexCounter);

    row.innerHTML = `
      <div class="form-group" style="flex: 1; margin-bottom: 0;">
        <input 
          type="url" 
          class="input-field reel-url-input" 
          placeholder="https://www.instagram.com/reel/..." 
          required
        >
        <div class="field-error-text reel-error-msg">This field is required.</div>
      </div>
      <button type="button" class="btn-action btn-secondary btn-remove-reel" aria-label="Remove">✕</button>
    `;

    reelsList.appendChild(row);

    // Setup remove listener for the newly added button
    const removeBtn = row.querySelector('.btn-remove-reel');
    removeBtn.addEventListener('click', () => {
      row.remove();
    });

    reelIndexCounter++;
  });

  // Set up listeners for initial row(s) to remove error state on typing
  reelsList.addEventListener('input', (e) => {
    if (e.target.classList.contains('reel-url-input')) {
      e.target.classList.remove('error');
      const errorMsg = e.target.parentElement.querySelector('.reel-error-msg');
      if (errorMsg) errorMsg.style.display = 'none';
    }
  });

  // Clear errors on input focuses
  const clearFieldListener = (inputField, errorBlock) => {
    inputField.addEventListener('input', () => {
      inputField.classList.remove('error');
      errorBlock.style.display = 'none';
    });
  };

  clearFieldListener(userName, userNameError);
  clearFieldListener(userDob, userDobError);
  clearFieldListener(userCity, userCityError);
  userGender.addEventListener('change', () => {
    userGender.classList.remove('error');
    userGenderError.style.display = 'none';
  });
  declarationCheck.addEventListener('change', () => {
    declarationError.style.display = 'none';
  });

  // --- Submit Validations & Success Redirections ---
  campaignForm.addEventListener('submit', (e) => {
    e.preventDefault();

    if (!phoneVerified) return;

    let hasErrors = false;

    // 1. Validate name
    if (!userName.value.trim()) {
      userName.classList.add('error');
      userNameError.textContent = "Full name is required.";
      userNameError.style.display = 'block';
      hasErrors = true;
    }

    // 2. Validate DOB & Age Range
    if (!userDob.value) {
      userDob.classList.add('error');
      userDobError.textContent = "Date of birth is required.";
      userDobError.style.display = 'block';
      hasErrors = true;
    } else {
      const computedAge = calcAge(userDob.value);
      if (computedAge < 18 || computedAge > 36) {
        userDob.classList.add('error');
        userDobError.textContent = "Age must be between 18 and 36.";
        userDobError.style.display = 'block';
        hasErrors = true;
      }
    }

    // 3. Validate Gender
    if (!userGender.value) {
      userGender.classList.add('error');
      userGenderError.style.display = 'block';
      hasErrors = true;
    }

    // 4. Validate City
    if (!userCity.value.trim()) {
      userCity.classList.add('error');
      userCityError.style.display = 'block';
      hasErrors = true;
    }

    // 5. Validate Reel URLs
    const reelInputRows = reelsList.querySelectorAll('.reel-input-row');
    reelInputRows.forEach(row => {
      const input = row.querySelector('.reel-url-input');
      const errorMsg = row.querySelector('.reel-error-msg');
      const urlValue = input.value.trim();

      if (!urlValue) {
        input.classList.add('error');
        errorMsg.textContent = "This field is required.";
        errorMsg.style.display = 'block';
        hasErrors = true;
      } else if (!isValidReelUrl(urlValue)) {
        input.classList.add('error');
        errorMsg.textContent = "Enter a valid Instagram Reel URL.";
        errorMsg.style.display = 'block';
        hasErrors = true;
      } else {
        input.classList.remove('error');
        errorMsg.style.display = 'none';
      }
    });

    // 6. Validate Declaration Checkbox
    if (!declarationCheck.checked) {
      declarationError.style.display = 'block';
      hasErrors = true;
    }

    // Stop if errors exist
    if (hasErrors) {
      // Find first error element and scroll to it
      const firstError = campaignForm.querySelector('.error, .field-error-text[style*="display: block"]');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    // Submit state loading
    submitRegistrationBtn.classList.add('loading');
    submitRegistrationBtn.disabled = true;

    // Collect Reel URLs from input elements
    const reelUrls = [];
    const reelInputs = reelsList.querySelectorAll('.reel-url-input');
    reelInputs.forEach(input => {
      const val = input.value.trim();
      if (val) reelUrls.push(val);
    });

    const payload = {
      name: userName.value.trim(),
      phone: phoneInput.value.trim(),
      dob: userDob.value,
      gender: userGender.value,
      city: userCity.value.trim(),
      reelUrls: reelUrls
    };

    fetch('/api/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })
    .then(response => response.json())
    .then(data => {
      submitRegistrationBtn.classList.remove('loading');
      if (data.success) {
        // Render success screen (exact replica of React FormPage submitted state)
        const mainAppContainer = document.querySelector('.main-app-container');
        mainAppContainer.innerHTML = `
          <div style="background-color: var(--card-bg); border: 1px solid var(--border-color); border-radius: 12px; padding: 48px; max-width: 440px; margin: 80px auto; text-align: center; box-shadow: 0 1px 3px 0 rgba(0,0,0,0.05);">
            <p style="font-size: 3rem; color: #10b981; margin-bottom: 24px; line-height: 1;">✓</p>
            <h2 style="font-family: var(--font-heading); font-size: 1.15rem; font-weight: 700; color: #111827; margin-bottom: 8px;">Submission received</h2>
            <p style="color: var(--text-muted); font-size: 0.875rem; line-height: 1.5; padding: 0 10px;">
              Your registration has been submitted. Our team will follow up shortly.
            </p>
          </div>
        `;
      } else {
        submitRegistrationBtn.disabled = false;
        alert(data.message || 'Failed to submit registration. Please try again.');
      }
    })
    .catch(err => {
      submitRegistrationBtn.classList.remove('loading');
      submitRegistrationBtn.disabled = false;
      console.error('Submission error:', err);
      alert('Network error occurred. Please try again.');
    });

  });

});
