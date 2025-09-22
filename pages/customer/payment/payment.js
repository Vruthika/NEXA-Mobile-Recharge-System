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

// Function to fetch plan data
async function fetchPlanData() {
  console.log("Starting to fetch plan data...");
  try {
    const planId = getUrlParameter("planId");
    console.log("Plan ID from URL:", planId);

    if (!planId) {
      console.warn("No planId found in URL, using fallback");
      // Fallback to default values
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

    // Update UI with plan data
    updatePlanDetails(selectedPlan);
  } catch (error) {
    console.error("Error fetching plan data:", error);
    // Fallback to default values
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

  // Ensure all elements exist before updating
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

  planData = plan;
  console.log("Plan details updated successfully");
}

// Payment functionality
document.addEventListener("DOMContentLoaded", function () {
  console.log("DOM loaded, initializing payment page...");

  // Wait a bit for all elements to be properly rendered
  setTimeout(() => {
    // Fetch plan data on page load
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
    // Hide all forms and instruction
    cardPaymentForm.classList.remove("active");
    netBankingForm.classList.remove("active");
    selectMethodInstruction.style.display = "none";

    // Show selected form
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

    if (!expiryDate || !expiryDate.match(/^(0[1-9]|1[0-2])\/([0-9]{2})$/)) {
      alert("Please enter a valid expiry date (MM/YY)");
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

  function processPayment(button) {
    // Show loading state
    const originalHTML = button.innerHTML;
    button.innerHTML =
      '<span class="material-icons animate-spin mr-2">hourglass_empty</span>Processing...';
    button.disabled = true;

    let lastTransactionId = 1028;
    function getNextTransactionId() {
      lastTransactionId++;
      return "TNX" + lastTransactionId;
    }
    const customers =
      "https://68c7990d5d8d9f5147324d39.mockapi.io/v1/Customers";
    // Create transaction data
    const transactionData = {
      planId: selectedPlan.id,
      planName: selectedPlan.name,
      amount: selectedPlan.price,
      status: "Success",

      transactionDate: new Date().toISOString(),
      userId: "user_" + Math.random().toString(36).substr(2, 9), // Generate random user ID
      transactionId: getNextTransactionId(),
    };

    console.log("Creating transaction:", transactionData);

    // Simulate payment processing and create transaction
    setTimeout(async function () {
      try {
        // Create transaction record
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
          console.log("Transaction created successfully:", createdTransaction);

          // Show success animation
          successAnimation.classList.add("active");

          // Store transaction details for dashboard redirect
          localStorage.setItem(
            "lastTransaction",
            JSON.stringify(createdTransaction)
          );
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

      // Reset button state
      button.innerHTML = originalHTML;
      button.disabled = false;
    }, 2500);
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
