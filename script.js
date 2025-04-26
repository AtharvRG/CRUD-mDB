// script.js
const API_URL = 'http://localhost:3000/api/items'; // Backend API URL

// DOM Elements
const itemList = document.getElementById('item-list');
const itemForm = document.getElementById('item-form');
const formTitle = document.getElementById('form-title');
const itemIdInput = document.getElementById('item-id');
const nameInput = document.getElementById('name');
const quantityInput = document.getElementById('quantity');
const unitInput = document.getElementById('unit');
const categoryInput = document.getElementById('category');
const locationInput = document.getElementById('location');
const submitBtn = document.getElementById('submit-btn');
const cancelBtn = document.getElementById('cancel-btn');

// --- Functions ---

// Fetch all items from the API and display them
async function fetchItems() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const items = await response.json();
        displayItems(items);
    } catch (error) {
        console.error('Error fetching items:', error);
        itemList.innerHTML = '<tr><td colspan="6">Error loading items. Is the server running?</td></tr>';
    }
}

// Display items in the table
function displayItems(items) {
    itemList.innerHTML = ''; // Clear previous list or loading message
    if (items.length === 0) {
        itemList.innerHTML = '<tr><td colspan="6">No items in inventory. Add one above!</td></tr>';
        return;
    }

    items.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${item.name}</td>
            <td>${item.quantity}</td>
            <td>${item.unit}</td>
            <td>${item.category}</td>
            <td>${item.location}</td>
            <td>
                <button class="action-btn edit-btn" data-id="${item._id}">Edit</button>
                <button class="action-btn delete-btn" data-id="${item._id}">Delete</button>
            </td>
        `;
        itemList.appendChild(tr);
    });
}

// Handle form submission (Add or Update)
async function handleFormSubmit(event) {
    event.preventDefault(); // Prevent default page reload

    const itemId = itemIdInput.value;
    const itemData = {
        name: nameInput.value,
        quantity: parseFloat(quantityInput.value), // Ensure quantity is a number
        unit: unitInput.value,
        category: categoryInput.value,
        location: locationInput.value,
    };

    // Basic validation (more can be added)
    if (!itemData.name || isNaN(itemData.quantity) || !itemData.unit) {
        alert('Please fill in all required fields correctly.');
        return;
    }

    try {
        let response;
        let method;
        let url;

        if (itemId) {
            // Update existing item (PUT request)
            method = 'PUT';
            url = `${API_URL}/${itemId}`;
        } else {
            // Add new item (POST request)
            method = 'POST';
            url = API_URL;
        }

        response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(itemData),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Failed to ${itemId ? 'update' : 'add'} item: ${errorData.message || response.statusText}`);
        }

        // const result = await response.json(); // Get created/updated item if needed
        // console.log(`${itemId ? 'Updated' : 'Added'} item:`, result);

        resetForm();
        fetchItems(); 

    } catch (error) {
        console.error(`Error ${itemId ? 'updating' : 'adding'} item:`, error);
        alert(`Error: ${error.message}`);
    }
}

// Populate form for editing
async function populateFormForEdit(id) {
    try {
        const response = await fetch(`${API_URL}/${id}`); // Fetch specific item
        if (!response.ok) throw new Error('Item not found');
        const item = await response.json();

        formTitle.textContent = 'Edit Item';
        itemIdInput.value = item._id;
        nameInput.value = item.name;
        quantityInput.value = item.quantity;
        unitInput.value = item.unit;
        categoryInput.value = item.category;
        locationInput.value = item.location;
        submitBtn.textContent = 'Update Item';
        cancelBtn.style.display = 'inline-block'; // Show cancel button

        // Scroll to form for better UX on mobile
        itemForm.scrollIntoView({ behavior: 'smooth' });

    } catch (error) {
        console.error('Error fetching item for edit:', error);
        alert('Could not load item details for editing.');
    }
}

// Delete an item
async function deleteItem(id) {
    if (!confirm('Are you sure you want to delete this item?')) {
        return; // Stop if user cancels
    }

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Failed to delete item: ${errorData.message || response.statusText}`);
        }

        // console.log('Item deleted successfully');
        fetchItems(); 

    } catch (error) {
        console.error('Error deleting item:', error);
        alert(`Error: ${error.message}`);
    }
}

// Reset form to default state (for adding)
function resetForm() {
    itemForm.reset(); 
    itemIdInput.value = ''; 
    formTitle.textContent = 'Add New Item';
    submitBtn.textContent = 'Add Item';
    cancelBtn.style.display = 'none'; 
}

// --- Event Listeners ---

// Listen for form submission
itemForm.addEventListener('submit', handleFormSubmit);

// Listen for clicks within the item list (using event delegation)
itemList.addEventListener('click', (event) => {
    if (event.target.classList.contains('edit-btn')) {
        const id = event.target.dataset.id;
        populateFormForEdit(id);
    } else if (event.target.classList.contains('delete-btn')) {
        const id = event.target.dataset.id;
        deleteItem(id);
    }
});

// Listen for cancel button click
cancelBtn.addEventListener('click', resetForm);

// --- Initial Load ---
// Fetch items when the page loads
document.addEventListener('DOMContentLoaded', fetchItems);