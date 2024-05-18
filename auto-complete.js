export default class AutoComplete {

    /**
     *
     * @param config
     * @param config.selector
     * @param config.url
     * @param config.suggestion
     * @param config.activeAutoComplete
     * @param config.key
     * @param config.maxResults
     * @param config.onEventSelection
     * @param config.placeholder
     * @param config.checkbox
     * @param config.manipulateData
     */

    constructor(config = {}) {
        // Validate and set default configuration parameters
        if (config.selector === undefined) {
            throw new Error('inputElement is required');
        }
        if (config.checkbox === undefined) {
            config.checkbox = null;
            config.activeAutoComplete = true;
        }
        if (config.placeholder === undefined) {
            config.placeholder = 'Autocomplétion activée';
        }
        if (config.url === undefined) {
            config.url = null;
        }
        if (config.suggestion === undefined) {
            config.suggestion = null;
        }
        if (config.url === null && config.suggestion === null) {
            throw new Error('url or suggestion is required');
        }
        if (config.url !== null && config.suggestion !== null) {
            throw new Error('url and suggestion are mutually exclusive');
        }
        if (config.key === undefined) {
            config.key = null;
        }
        if (config.maxResults === undefined) {
            config.maxResults = null;
        }
        if (config.onEventSelection === undefined || config.onEventSelection === null) {
            config.onEventSelection = function (event, item) {
            };
        }
        if (config.manipulateData === undefined || config.manipulateData === null) {
            config.manipulateData = function (data) {
            };
        }

        // Assign properties based on configuration
        this.inputElement = document.querySelector(config.selector);
        this.apiUrl = config.url;
        this.arrayItems = config.suggestion;
        this.activeAutoComplete = config.activeAutoComplete;
        this.onEventSelection = config.onEventSelection
        this.key = config.key;
        this.maxResults = config.maxResults;
        this.placeholder = config.placeholder;
        this.checkboxForChangingAutoComplete = document.querySelector(config.checkbox);
        this.manipulateData = config.manipulateData;
        this.currentFocusIndex = -1;
        this.controller = null;

        this.handleCheckboxChangeIfProvidedOrInitialize();

    }

    // Handle checkbox change event if checkbox is provided
    handleCheckboxChangeIfProvidedOrInitialize() {
        if (this.checkboxForChangingAutoComplete) {
            this.checkboxForChangingAutoComplete.addEventListener('change', (event) => {
                this.activeAutoComplete = this.checkboxForChangingAutoComplete.checked;
                if (this.activeAutoComplete === false) {
                    this.destroy();
                } else if (this.activeAutoComplete === true) {
                    this.initialize();
                }
            });
        } else {
            this.initialize();
        }
    }

    // Initialize the autocomplete functionality
    initialize() {
        if (this.apiUrl !== null) {
            this.initEventListenersForApi();
        } else if (this.arrayItems !== null) {
            this.initEventListenersForArray();
        }
        this.inputElement.placeholder = this.placeholder;
        this.wrapElement(this.inputElement);
    }

    // Destroy the autocomplete functionality
    destroy() {
        this.closeAllLists();
        this.unwrapElement(this.inputElement);
        this.removeEventListeners();
        this.inputElement.placeholder = '';
    }

    // Add event listeners for fetching data from API
    initEventListenersForApi() {
        this.inputElement.addEventListener('input', this.handleInputFromApi.bind(this));
        this.inputElement.addEventListener('keydown', this.handleKeydown.bind(this));
        document.addEventListener('click', this.closeAllLists.bind(this));
    }

    // Add event listeners for using local data array
    initEventListenersForArray() {
        this.inputElement.addEventListener('input', this.handleInputFromArray.bind(this));
        this.inputElement.addEventListener('keydown', this.handleKeydown.bind(this));
        document.addEventListener('click', this.closeAllLists.bind(this));
    }

    // Remove all event listeners
    removeEventListeners() {
        this.inputElement.removeEventListener('input', this.handleInputFromApi.bind(this));
        this.inputElement.removeEventListener('input', this.handleInputFromArray.bind(this));
        this.inputElement.removeEventListener('keydown', this.handleKeydown.bind(this));
        document.removeEventListener('click', this.closeAllLists.bind(this));
    }


    // Handle input event when fetching data from API
    async handleInputFromApi(event) {

        if (this.activeAutoComplete === false) {
            this.destroy();
            return;
        }

        const value = this.inputElement.value;
        this.closeAllLists();

        if (!value) {
            return;
        }

        this.currentFocusIndex = -1;

        const listContainer = document.createElement("ul");
        listContainer.setAttribute("id", this.inputElement.id + "-autocomplete-list");
        listContainer.setAttribute("class", "autocomplete-items");
        this.inputElement.parentNode.appendChild(listContainer);

        // Fetch data from API if input length is sufficient
        if (value.length >= 3) {

            try {
                if (this.controller !== null) {
                    this.controller.abort();
                    this.controller = null;
                }
                this.controller = new AbortController();
                const response = await fetch(`${this.apiUrl + encodeURIComponent(value)}`, {
                    signal: this.controller.signal
                });
                if (!response.ok) {
                    throw new Error('Network response was not ok.');
                }

                let data = await response.json();

                if (this.manipulateData !== null) {
                    data = this.manipulateData(data);
                }

                if (this.maxResults !== null) {
                    if (data.length > this.maxResults) {
                        data = data.slice(0, this.maxResults);
                    }
                }

                // Populate list with fetched data
                data.forEach((item) => {
                    const itemElement = document.createElement("li");
                    itemElement.innerHTML = `<strong>${item[this.key].substr(0, value.length)}</strong>${item[this.key].substr(value.length)}`;
                    itemElement.innerHTML += `<input type='hidden' value='${JSON.stringify(item)}'>`;

                    itemElement.addEventListener('click', (event) => {
                        this.onEventSelection(event, JSON.parse(itemElement.getElementsByTagName("input")[0].value));
                        this.closeAllLists();
                    });
                    listContainer.appendChild(itemElement);
                });
            } catch (error) {
                console.error('Failed to fetch suggestions:', error);
            }
        }
    }


    // Handle input event when using local data array
    handleInputFromArray(event) {

        if (this.activeAutoComplete === false) {
            this.destroy();
            return;
        }

        const value = this.inputElement.value;
        this.closeAllLists();

        if (!value) {
            return;
        }

        this.currentFocusIndex = -1;

        const listContainer = document.createElement("ul");
        listContainer.setAttribute("id", this.inputElement.id + "-autocomplete-list");
        listContainer.setAttribute("class", "autocomplete-items");
        this.inputElement.parentNode.appendChild(listContainer);

        // Filter and display matching suggestions from local array
        this.arrayItems.forEach((item) => {
            if (item.substr(0, value.length).toUpperCase() === value.toUpperCase()) {
                const itemElement = document.createElement("li");
                itemElement.innerHTML = `<strong>${item.substr(0, value.length)}</strong>${item.substr(value.length)}`;
                itemElement.innerHTML += `<input type='hidden' value='${item}'>`;

                itemElement.addEventListener('click', (event) => {
                    this.onEventSelection(event);
                    this.inputElement.value = itemElement.getElementsByTagName("input")[0].value;
                    this.closeAllLists();
                });
                listContainer.appendChild(itemElement);
            }
        });
    }

    // Handle keydown events for navigation and selection
    handleKeydown(event) {
        const list = document.getElementById(this.inputElement.id + "-autocomplete-list");
        let items = list ? list.getElementsByTagName("li") : [];
        switch (event.keyCode) {
            case 40: // Arrow Down
                this.currentFocusIndex++;
                this.activateItem(items);
                break;
            case 38: // Arrow Up
                this.currentFocusIndex--;
                this.activateItem(items);
                break;
            case 13: // Enter
                event.preventDefault();
                if (this.currentFocusIndex > -1) {
                    items[this.currentFocusIndex].click();
                }
                break;
        }
    }

    // Activate the currently focused item in the list
    activateItem(items) {
        if (!items) {
            return;
        }
        this.deactivateItems(items);
        if (this.currentFocusIndex >= items.length) {
            this.currentFocusIndex = 0;
        }
        if (this.currentFocusIndex < 0) {
            this.currentFocusIndex = items.length - 1;
        }

        const activeItem = items[this.currentFocusIndex];
        activeItem.classList.add("autocomplete-active");

        activeItem.scrollIntoView({
            block: "nearest",
            behavior: "smooth"
        });
    }

    // Deactivate all items in the list
    deactivateItems(items) {
        Array.from(items).forEach(item => item.classList.remove("autocomplete-active"));
    }

    // Close all suggestion lists, except the one passed as an argument
    closeAllLists(element) {
        const lists = document.getElementsByClassName("autocomplete-items");
        Array.from(lists).forEach(list => {
            if (element !== list && element !== this.inputElement) {
                list.parentNode.removeChild(list);
            }
        });
    }

    // Wrap the input element in a div with class 'autocomplete'
    wrapElement(element) {
        if (element.parentNode && element.parentNode.classList.contains('autocomplete')) {
            return;
        }
        const wrapper = document.createElement('div');
        wrapper.className = "autocomplete";
        element.parentNode.insertBefore(wrapper, element);
        wrapper.appendChild(element);
    }

    // Unwrap the input element from the div with class 'autocomplete'
    unwrapElement(element) {

        if (element && element.parentNode && element.parentNode.tagName === 'DIV' && element.parentNode.classList.contains('autocomplete')) {
            const parentDiv = element.parentNode;
            parentDiv.parentNode.insertBefore(element, parentDiv);
            parentDiv.parentNode.removeChild(parentDiv);
        }
    }

}