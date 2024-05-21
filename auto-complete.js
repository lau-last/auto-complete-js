export default class AutoComplete {

    /**
     * Constructs an AutoComplete instance.
     * @param {Object} config - Configuration object for the AutoComplete instance.
     * @param {string} config.selector - CSS selector for the input element.
     * @param {string} [config.url=null] - Optional URL for fetching suggestions from an API.
     * @param {Array} [config.suggestion=null] - Optional array of suggestions.
     * @param {boolean} [config.activeAutoComplete=true] - Boolean to enable or disable autocomplete.
     * @param {Array|string|function} [config.keys=null] - Optional key for accessing values in the suggestion objects.
     * @param {number} [config.maxResults=null] - Optional maximum number of results to display.
     * @param {function} [config.onEventSelection=(event, item) => {document.querySelector(selector).value = this.getItemText(item);}] - Callback function for selection events.
     * @param {string} [config.placeholder='Autocomplete enabled'] - Placeholder text for the input element.
     * @param {string} [config.checkbox=null] - Optional CSS selector for a checkbox to toggle autocomplete.
     * @param {number} [config.inputLength=null] - Optional input length to trigger autocomplete.
     * @param {function} [config.manipulateData=(data) => {return data;}] - Optional function to manipulate data before display.
     */
    constructor(config = {}) {
        // Destructure the configuration object with default values
        const {
            selector, // Required CSS selector for the input element
            url = null, // Optional URL for fetching suggestions from an API
            suggestion = null, // Optional array of suggestions
            activeAutoComplete = true, // Boolean to enable or disable autocomplete
            keys = null, // Optional key for accessing values in the suggestion objects
            maxResults = null, // Optional maximum number of results to display
            inputLength = null,
            placeholder = 'Autocomplete enabled', // Placeholder text for the input element
            checkbox = null, // Optional CSS selector for a checkbox to toggle autocomplete
            manipulateData = (data) => {return data}, // Optional function to manipulate data before display
            onEventSelection = (event, item) => { document.querySelector(selector).value = this.getItemText(item); }, // Callback function for selection events
        } = config;

        // Ensure a selector is provided
        if (!selector) {
            throw new Error('The "selector" parameter is required.');
        }
        // Ensure either a URL or suggestions array is provided, but not both
        if (!url && !suggestion) {
            throw new Error('Either "url" or "suggestion" parameter is required.');
        }
        if (url && suggestion) {
            throw new Error('"url" and "suggestion" parameters are mutually exclusive.');
        }

        // Initialize instance variables
        this.inputElement = document.querySelector(selector); // Select input element
        if (!this.inputElement) {
            throw new Error(`No element found for selector "${selector}"`);
        }
        this.apiUrl = url; // API URL for fetching suggestions
        this.arrayItems = suggestion; // Array of suggestions
        this.activeAutoComplete = activeAutoComplete; // Autocomplete activation flag
        this.onEventSelection = onEventSelection; // Event selection callback
        this.keys = keys; // Key for accessing suggestion values
        this.maxResults = maxResults; // Maximum results to display
        this.inputLength = inputLength;
        this.placeholder = placeholder; // Placeholder text
        this.checkboxForChangingAutoComplete = document.querySelector(checkbox); // Checkbox element
        this.manipulateData = manipulateData; // Data manipulation function
        this.currentFocusIndex = -1; // Index of currently focused suggestion
        this.controller = null; // Controller for aborting fetch requests


        // Bind methods to maintain correct context
        this.handleInputFromApiBound = this.debounce(this.handleInputFromApi.bind(this), 300);
        this.handleInputFromArrayBound = this.debounce(this.handleInputFromArray.bind(this), 300);
        this.handleKeydownBound = this.handleKeydown.bind(this);
        this.closeAllListsBound = this.closeAllLists.bind(this);

        // Initialize the autocomplete or set up checkbox event listener
        this.handleCheckboxChangeIfProvidedOrInitialize();
    }

    // Initialize or set up checkbox change event
    handleCheckboxChangeIfProvidedOrInitialize() {
        if (this.checkboxForChangingAutoComplete) {
            this.checkboxForChangingAutoComplete.addEventListener('change', (event) => {
                this.activeAutoComplete = this.checkboxForChangingAutoComplete.checked; // Update autocomplete status
                if (!this.activeAutoComplete) {
                    this.destroy(); // Destroy autocomplete if deactivated
                } else {
                    this.initialize(); // Initialize autocomplete if activated
                }
            });
        } else {
            this.initialize(); // Initialize autocomplete if no checkbox is provided
        }
    }

    // Initialize the autocomplete feature
    initialize() {
        if (this.apiUrl !== null) {
            this.addEventListenersForApi(); // Add API event listeners if URL is provided
        } else if (this.arrayItems !== null) {
            this.addEventListenersForArray(); // Add array event listeners if suggestions array is provided
        }
        this.inputElement.placeholder = this.placeholder; // Set placeholder text
        this.wrapElement(this.inputElement); // Wrap input element for styling
    }

    // Destroy the autocomplete feature
    destroy() {
        this.closeAllLists(); // Close all suggestion lists
        this.unwrapElement(this.inputElement); // Unwrap input element
        this.removeEventListeners(); // Remove event listeners
        this.inputElement.placeholder = ''; // Clear placeholder text
    }

    // Add event listeners for API-based suggestions
    addEventListenersForApi() {
        this.inputElement.addEventListener('input', this.handleInputFromApiBound); // Handle input events
        this.inputElement.addEventListener('keydown', this.handleKeydownBound); // Handle keydown events
        document.addEventListener('click', this.closeAllListsBound); // Close suggestion lists on click outside
    }

    // Add event listeners for array-based suggestions
    addEventListenersForArray() {
        this.inputElement.addEventListener('input', this.handleInputFromArrayBound); // Handle input events
        this.inputElement.addEventListener('keydown', this.handleKeydownBound); // Handle keydown events
        document.addEventListener('click', this.closeAllListsBound); // Close suggestion lists on click outside
    }

    // Remove event listeners
    removeEventListeners() {
        this.inputElement.removeEventListener('input', this.handleInputFromApiBound); // Remove API input event listener
        this.inputElement.removeEventListener('input', this.handleInputFromArrayBound); // Remove array input event listener
        this.inputElement.removeEventListener('keydown', this.handleKeydownBound); // Remove keydown event listener
        document.removeEventListener('click', this.closeAllListsBound); // Remove click event listener
    }

    // Handle input for API-based suggestions
    async handleInputFromApi(event) {
        if (!this.activeAutoComplete) {
            this.destroy(); // Destroy autocomplete if deactivated
            return;
        }

        const value = this.inputElement.value; // Get input value
        this.closeAllLists(); // Close existing suggestion lists
        if (!value) {
            return; // Return if input value is empty
        }

        let inputLength = this.inputLength !== null ? this.inputLength : 3; // Set input length
        if (value.length >= inputLength) { // Fetch suggestions if input length
            try {
                if (this.controller) {
                    this.controller.abort(); // Abort previous fetch request
                }
                this.controller = new AbortController();
                const response = await fetch(`${this.apiUrl + encodeURIComponent(value)}`, {
                    signal: this.controller.signal // Set abort signal
                });
                if (!response.ok) {
                    throw new Error('Network response was not ok.'); // Handle fetch error
                }

                let data = await response.json(); // Parse response JSON
                data = this.manipulateData(data); // Manipulate data if function provided
                if (this.maxResults) {
                    data = data.slice(0, this.maxResults); // Limit results if maxResults is set
                }

                this.displaySuggestions(data, value); // Display suggestions
            } catch (error) {
                console.error('Failed to fetch suggestions:', error); // Handle fetch error
            }
        }
    }

    // Handle input for array-based suggestions
    handleInputFromArray(event) {
        if (!this.activeAutoComplete) {
            this.destroy(); // Destroy autocomplete if deactivated
            return;
        }

        const value = this.inputElement.value; // Get input value
        this.closeAllLists(); // Close existing suggestion lists
        if (!value) {
            return; // Return if input value is empty
        }

        // Filter array items based on input value
        const filteredData = this.arrayItems.filter(item =>
            item.substr(0, value.length).toUpperCase() === value.toUpperCase()
        );

        this.displaySuggestions(filteredData, value); // Display suggestions
    }

    // Handle keydown events for navigation
    handleKeydown(event) {
        const list = document.getElementById(this.inputElement.id + "-autocomplete-list");
        let items = list ? list.getElementsByTagName("li") : []; // Get list items
        switch (event.keyCode) {
            case 40: // Arrow Down
                this.currentFocusIndex++; // Move focus down
                this.activateItem(items); // Activate item
                break;
            case 38: // Arrow Up
                this.currentFocusIndex--; // Move focus up
                this.activateItem(items); // Activate item
                break;
            case 13: // Enter
                event.preventDefault(); // Prevent form submission
                if (this.currentFocusIndex > -1) {
                    items[this.currentFocusIndex].click(); // Select item if focused
                }
                break;
        }
    }

    // Activate item in the suggestion list
    activateItem(items) {
        if (!items) {
            return;
        }
        this.deactivateItems(items); // Deactivate all items
        if (this.currentFocusIndex >= items.length) {
            this.currentFocusIndex = 0; // Loop back to first item
        }
        if (this.currentFocusIndex < 0) {
            this.currentFocusIndex = items.length - 1; // Loop to last item
        }

        const activeItem = items[this.currentFocusIndex];
        activeItem.classList.add("autocomplete-active"); // Add active class
        activeItem.setAttribute('aria-selected', 'true'); // Set aria-selected attribute
        this.inputElement.setAttribute('aria-activedescendant', activeItem.id); // Set aria-activedescendant
        activeItem.scrollIntoView({
            block: "nearest",
            behavior: "smooth"
        }); // Scroll into view
    }

    // Deactivate all items in the suggestion list
    deactivateItems(items) {
        Array.from(items).forEach(item => {
            item.classList.remove("autocomplete-active"); // Remove active class
            item.removeAttribute('aria-selected'); // Remove aria-selected attribute
        });
    }

    // Close all suggestion lists
    closeAllLists(element) {
        const lists = document.getElementsByClassName("autocomplete-items");
        Array.from(lists).forEach(list => {
            if (element !== list && element !== this.inputElement) {
                list.parentNode.removeChild(list); // Remove list from DOM
            }
        });
    }

    // Wrap the input element with a div for styling
    wrapElement(element) {
        if (element.parentNode && element.parentNode.classList.contains('autocomplete')) {
            return;
        }
        const wrapper = document.createElement('div');
        wrapper.className = "autocomplete"; // Add class to wrapper
        element.parentNode.insertBefore(wrapper, element); // Insert wrapper before element
        wrapper.appendChild(element); // Append element to wrapper
    }

    // Unwrap the input element from the div
    unwrapElement(element) {
        if (element && element.parentNode && element.parentNode.tagName === 'DIV' && element.parentNode.classList.contains('autocomplete')) {
            const parentDiv = element.parentNode;
            parentDiv.parentNode.insertBefore(element, parentDiv); // Insert element before wrapper
            parentDiv.parentNode.removeChild(parentDiv); // Remove wrapper
        }
    }

    // Debounce function to delay execution
    debounce(func, wait) {
        let timeout;
        return function(...args) {
            const context = this;
            clearTimeout(timeout); // Clear previous timeout
            timeout = setTimeout(() => func.apply(context, args), wait); // Set new timeout
        };
    }

    // Get item text based on key(s)
    getItemText(item) {

        let keys = this.keys;

        if (Array.isArray(keys)) {
            return keys.map(k => item[k]).filter(Boolean).join(' ');
        } else if (typeof keys === 'string') {
            return item[keys];
        } else if (typeof keys === 'function') {
            return keys(item);
        }
        return item;
    }

    // Display suggestions in the dropdown
    displaySuggestions(data, value) {
        this.currentFocusIndex = -1; // Reset focus index
        const listContainer = document.createElement("ul");
        listContainer.setAttribute("id", this.inputElement.id + "-autocomplete-list"); // Set list ID
        listContainer.setAttribute("class", "autocomplete-items"); // Set list class
        this.inputElement.parentNode.appendChild(listContainer); // Append list to input element parent
        data.forEach((item) => {
            const itemElement = document.createElement("li");
            const itemText = this.getItemText(item); // Get item text
            itemElement.innerHTML = `<strong>${itemText.substr(0, value.length)}</strong>${itemText.substr(value.length)}`; // Highlight match
            itemElement.innerHTML += `<input type='hidden' value='${JSON.stringify(item)}'>`; // Store item data
            itemElement.addEventListener('click', (event) => {
                this.onEventSelection(event, JSON.parse(itemElement.getElementsByTagName("input")[0].value)); // Call selection callback
                // this.inputElement.value = itemText; // Optionally set input value
                this.closeAllLists(); // Close suggestion lists
            });
            listContainer.appendChild(itemElement); // Append item to list
        });
    }
}