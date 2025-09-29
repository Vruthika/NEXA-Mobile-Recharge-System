// Global variables
let selectedPlan = null;
let planData = {};

// Load navbar and footer
fetch("/components/navbar.html")
  .then((response) => response.text())
  .then((data) => {
    document.getElementById("navbar").innerHTML = data;
  })
  .catch((error) => console.error("Error loading navbar:", error));

fetch("/components/footer.html")
  .then((response) => response.text())
  .then((data) => {
    document.getElementById("footer").innerHTML = data;
  })
  .catch((error) => console.error("Error loading footer:", error));

// Function to get URL parameters
function getUrlParameter(name) {
  name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
  var regex = new RegExp("[\\?&]" + name + "=([^&#]*)");
  var results = regex.exec(location.search);
  return results === null
    ? ""
    : decodeURIComponent(results[1].replace(/\+/g, " "));
}

// Function to show login modal
function showLoginModal() {
  const modal = document.getElementById("login-modal");
  if (modal) {
    modal.classList.remove("hidden");
    modal.classList.add("flex");
  }
}

// Function to hide login modal
function hideLoginModal() {
  const modal = document.getElementById("login-modal");
  if (modal) {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
  }
}

// Function to check if user is logged in
function checkUserAuthentication() {
  const loggedInUser = localStorage.getItem("loggedInUser");
  if (!loggedInUser) {
    showLoginModal();
    return null;
  }
  return JSON.parse(loggedInUser);
}

// Function to fetch customer data from API
async function fetchCustomerData(customerId) {
  try {
    const response = await fetch(
      `https://68c7990d5d8d9f5147324d39.mockapi.io/v1/Customers/${customerId}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const customer = await response.json();
    return customer;
  } catch (error) {
    console.error("Error fetching customer data:", error);
    throw error;
  }
}

// Function to format date as YYYY-MM-DD
function formatDate(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Function to fetch plan data
async function fetchPlanData() {
  console.log("Starting to fetch plan data...");
  try {
    const planId = getUrlParameter("planId");
    console.log("Plan ID from URL:", planId);

    if (!planId) {
      console.warn("No planId found in URL, using fallback");
      updatePlanDetails({
        name: "Premium Monthly",
        category: "Popular Plans",
        validity: "28 days",
        price: 499,
      });
      return;
    }

    console.log("Fetching plans from API...");
    const response = await fetch(
      "https://68c7990d5d8d9f5147324d39.mockapi.io/v1/Plans"
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const plans = await response.json();
    console.log("Received plans:", plans.length, "plans");

    selectedPlan = plans.find((plan) => plan.id === planId);
    console.log("Selected plan:", selectedPlan);

    if (!selectedPlan) {
      console.error("Plan not found with ID:", planId);
      throw new Error("Plan not found");
    }

    updatePlanDetails(selectedPlan);
  } catch (error) {
    console.error("Error fetching plan data:", error);
    updatePlanDetails({
      name: "Premium Monthly",
      category: "Popular Plans",
      validity: "28 days",
      price: 499,
    });
  }
}

// Function to update plan details in UI
function updatePlanDetails(plan) {
  console.log("Updating plan details:", plan);

  const planName = document.getElementById("plan-name");
  const planCategory = document.getElementById("plan-category");
  const planValidity = document.getElementById("plan-validity");
  const planAmount = document.getElementById("plan-amount");
  const totalAmount = document.getElementById("total-amount");
  const cardPayAmount = document.getElementById("card-pay-amount");
  const netbankingPayAmount = document.getElementById("netbanking-pay-amount");
  const rechargeNumber = document.getElementById("recharge-number");

  if (
    !planName ||
    !planCategory ||
    !planValidity ||
    !planAmount ||
    !totalAmount ||
    !cardPayAmount ||
    !netbankingPayAmount
  ) {
    console.error("Some UI elements not found");
    return;
  }

  const formattedPrice = `₹${plan.price || "499"}`;

  planName.textContent = plan.name || "Premium Monthly";
  planCategory.textContent = plan.category || "Popular Plans";
  planValidity.textContent = plan.validity || "28 days";
  planAmount.textContent = formattedPrice;
  totalAmount.textContent = formattedPrice;
  cardPayAmount.textContent = formattedPrice;
  netbankingPayAmount.textContent = formattedPrice;

  if (rechargeNumber) {
    const rechargeForNumber = localStorage.getItem("rechargeForNumber");
    const loggedInUser = localStorage.getItem("loggedInUser");
    let displayNumber = "";

    if (rechargeForNumber) {
      displayNumber = rechargeForNumber;
    } else if (loggedInUser) {
      const user = JSON.parse(loggedInUser);
      displayNumber = user.phone || "Your number";
    }

    rechargeNumber.textContent = displayNumber;
  }

  planData = plan;
  console.log("Plan details updated successfully");
}

// Payment functionality
document.addEventListener("DOMContentLoaded", function () {
  console.log("DOM loaded, initializing payment page...");

  // Setup login modal handlers
  const loginModal = document.getElementById("login-modal");
  const goToLoginBtn = document.getElementById("go-to-login");
  const cancelLoginBtn = document.getElementById("cancel-login");

  if (goToLoginBtn) {
    goToLoginBtn.addEventListener("click", function () {
      const currentUrl = window.location.href;
      localStorage.setItem("redirectAfterLogin", currentUrl);
      window.location.href = "/pages/auth/login/login.html";
    });
  }

  if (cancelLoginBtn) {
    cancelLoginBtn.addEventListener("click", function () {
      hideLoginModal();
      window.location.href = "/pages/customer/landing/landing.html";
    });
  }

  // Check if user is logged in
  const loggedInUser = checkUserAuthentication();
  if (!loggedInUser) {
    return;
  }

  setTimeout(() => {
    fetchPlanData();
  }, 100);

  const debitCardOption = document.getElementById("debit-card-option");
  const creditCardOption = document.getElementById("credit-card-option");
  const netBankingOption = document.getElementById("net-banking-option");
  const cardPaymentForm = document.getElementById("card-payment-form");
  const netBankingForm = document.getElementById("net-banking-form");
  const selectMethodInstruction = document.getElementById(
    "select-method-instruction"
  );
  const payCardButton = document.getElementById("pay-card-button");
  const payNetbankingButton = document.getElementById("pay-netbanking-button");
  const successAnimation = document.getElementById("success-animation");
  const continueButton = document.getElementById("continue-button");

  // Payment method selection
  debitCardOption.addEventListener("click", function () {
    selectPaymentMethod(debitCardOption);
    showForm(cardPaymentForm);
  });

  creditCardOption.addEventListener("click", function () {
    selectPaymentMethod(creditCardOption);
    showForm(cardPaymentForm);
  });

  netBankingOption.addEventListener("click", function () {
    selectPaymentMethod(netBankingOption);
    showForm(netBankingForm);
  });

  // Process card payment
  payCardButton.addEventListener("click", function () {
    const cardNumber = document.getElementById("card-number").value;
    const cardName = document.getElementById("card-name").value;
    const expiryDate = document.getElementById("expiry-date").value;
    const cvv = document.getElementById("cvv").value;

    if (validateCardDetails(cardNumber, cardName, expiryDate, cvv)) {
      processPayment(payCardButton);
    }
  });

  // Process net banking payment
  payNetbankingButton.addEventListener("click", function () {
    const bank = document.getElementById("bank-select").value;
    const accountNumber = document.getElementById("account-number").value;
    const ifscCode = document.getElementById("ifsc-code").value;

    if (validateNetBankingDetails(bank, accountNumber, ifscCode)) {
      processPayment(payNetbankingButton);
    }
  });

  // Continue after successful payment
  continueButton.addEventListener("click", function () {
    const lastTransaction = JSON.parse(
      localStorage.getItem("lastTransaction") || "{}"
    );

    if (lastTransaction.isBillPayment) {
      localStorage.setItem("showBillPaymentSuccess", "true");
    }

    window.location.href = "/pages/customer/dashboard/dashboard.html";
  });

  // Helper functions
  function selectPaymentMethod(selected) {
    const paymentMethods = document.querySelectorAll(".payment-method");
    paymentMethods.forEach((method) => {
      method.classList.remove("selected");
    });
    selected.classList.add("selected");
  }

  function showForm(formToShow) {
    cardPaymentForm.classList.remove("active");
    netBankingForm.classList.remove("active");
    selectMethodInstruction.style.display = "none";
    formToShow.classList.add("active");
  }

  function validateCardDetails(cardNumber, cardName, expiryDate, cvv) {
    if (!cardNumber || cardNumber.replace(/\s/g, "").length !== 16) {
      alert("Please enter a valid 16-digit card number");
      return false;
    }

    if (!cardName || cardName.trim().length < 2) {
      alert("Please enter the name on your card");
      return false;
    }

    // Validate expiry date format
    if (!expiryDate || !expiryDate.match(/^(0[1-9]|1[0-2])\/([0-9]{2})$/)) {
      alert("Please enter a valid expiry date (MM/YY)");
      return false;
    }

    // Validate expiry date is not in the past
    const [month, year] = expiryDate.split("/");
    const expiryMonth = parseInt(month, 10);
    const expiryYear = parseInt("20" + year, 10);

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    if (
      expiryYear < currentYear ||
      (expiryYear === currentYear && expiryMonth < currentMonth)
    ) {
      alert("Card has expired. Please enter a valid expiry date");
      return false;
    }

    if (!cvv || cvv.length !== 3) {
      alert("Please enter a valid 3-digit CVV");
      return false;
    }

    return true;
  }

  function validateNetBankingDetails(bank, accountNumber, ifscCode) {
    if (!bank) {
      alert("Please select your bank");
      return false;
    }

    if (!accountNumber || accountNumber.length < 8) {
      alert("Please enter a valid account number");
      return false;
    }

    if (!ifscCode || ifscCode.length < 8) {
      alert("Please enter a valid IFSC code");
      return false;
    }

    return true;
  }

  async function processPayment(button) {
    const loggedInUser = checkUserAuthentication();
    if (!loggedInUser) {
      return;
    }

    const originalHTML = button.innerHTML;
    button.innerHTML =
      '<span class="material-icons animate-spin mr-2">hourglass_empty</span>Processing...';
    button.disabled = true;

    let lastTransactionId = 1040;
    function getNextTransactionId() {
      lastTransactionId++;
      return "TNX" + lastTransactionId;
    }

    try {
      const customerData = await fetchCustomerData(loggedInUser.id);

      const urlParams = new URLSearchParams(window.location.search);
      const isBillPayment = urlParams.get("type") === "bill";

      const rechargeForNumber = localStorage.getItem("rechargeForNumber");
      const phoneToUse = rechargeForNumber || customerData.phone;

      // Check if recharging own number vs another number
      const isOwnNumber =
        !rechargeForNumber || rechargeForNumber === customerData.phone;

      // Determine transaction type
      let transactionType;
      if (isBillPayment) {
        transactionType = "Bill Payment";
      } else if (isOwnNumber) {
        transactionType = "Prepaid";
      } else {
        transactionType = "Recharge";
      }

      const transactionData = {
        transaction_id: getNextTransactionId(),
        userId: phoneToUse,
        customerId: phoneToUse,
        phoneNumber: phoneToUse,
        name: customerData.name,
        phone: phoneToUse,
        planId: selectedPlan.id,
        plan: selectedPlan.name,
        type: transactionType,
        status: "Success",
        date: formatDate(new Date()),
        amount: selectedPlan.price,
        rechargedBy: customerData.id,
      };

      console.log("Creating transaction:", transactionData);

      setTimeout(async function () {
        try {
          const response = await fetch(
            "https://68ca32f2430c4476c3488311.mockapi.io/Transactions",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(transactionData),
            }
          );

          if (response.ok) {
            const createdTransaction = await response.json();
            console.log(
              "Transaction created successfully:",
              createdTransaction
            );

            createdTransaction.isBillPayment = isBillPayment;
            localStorage.setItem(
              "lastTransaction",
              JSON.stringify(createdTransaction)
            );

            successAnimation.classList.add("active");
          } else {
            throw new Error("Failed to create transaction");
          }
        } catch (error) {
          console.error("Error creating transaction:", error);
          alert(
            "Payment successful, but there was an issue recording the transaction. Please contact support."
          );
          successAnimation.classList.add("active");
        }

        button.innerHTML = originalHTML;
        button.disabled = false;
      }, 2500);
    } catch (error) {
      console.error("Error fetching customer data:", error);
      alert("Error processing payment. Please try again.");

      button.innerHTML = originalHTML;
      button.disabled = false;
    }
  }

  // Format card number with spaces
  const cardNumberInput = document.getElementById("card-number");
  if (cardNumberInput) {
    cardNumberInput.addEventListener("input", function (e) {
      let value = e.target.value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
      if (value.length > 0) {
        value = value.match(new RegExp(".{1,4}", "g")).join(" ");
      }
      e.target.value = value.substring(0, 19);
    });
  }

  // Format expiry date
  const expiryDateInput = document.getElementById("expiry-date");
  if (expiryDateInput) {
    expiryDateInput.addEventListener("input", function (e) {
      let value = e.target.value.replace(/\D/g, "");
      if (value.length > 2) {
        value = value.substring(0, 2) + "/" + value.substring(2, 4);
      }
      e.target.value = value;
    });
  }

  // Only allow numbers for CVV
  const cvvInput = document.getElementById("cvv");
  if (cvvInput) {
    cvvInput.addEventListener("input", function (e) {
      e.target.value = e.target.value.replace(/[^0-9]/g, "");
    });
  }
});
