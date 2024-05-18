# AutoComplete Class Documentation

## Introduction
The `AutoComplete` class is designed to provide autocomplete functionality to input fields within a web page. It supports fetching suggestions from a server via API or using a static array of suggestions.

## Configuration
To instantiate an `AutoComplete` object, you must pass a configuration object with the following properties:

- **selector**: CSS selector for the input element (required).
- **url**: URL to fetch suggestions from (mutually exclusive with `suggestion`).
- **suggestion**: Array of suggestions (mutually exclusive with `url`).
- **activeAutoComplete**: Boolean to activate or deactivate autocomplete.
- **key**: Key of the object property used for displaying suggestions.
- **maxResults**: Maximum number of suggestions to display.
- **onEventSelection**: Callback function that triggers when a suggestion is selected.
- **placeholder**: Placeholder text for the input field.
- **checkbox**: CSS selector for a checkbox to toggle the autocomplete feature on/off.
- **manipulateData**: Function to manipulate the data received from the API.

## Methods
### handleCheckboxChangeIfProvidedOrInitialize()
Handle checkbox change event if checkbox is provided

### initialize()
Initializes the event listeners and prepares the input element for autocomplete functionality based on the configuration.

### destroy()
Cleans up event listeners and any other modifications made to the DOM by the autocomplete functionality.

### handleInputFromApi(event)
Handles input event for API-based suggestions.

### handleInputFromArray(event)
Handles input event for array-based suggestions.

### handleKeydown(event)
Handles keydown events for navigating through suggestions.

### activateItem(items)
Highlights the current active item in the suggestion list.

### deactivateItems(items)
Removes highlighting from all items in the suggestion list.

### closeAllLists(element)
Closes all open suggestion lists.

### wrapElement(element)
Wraps the input element with a div to control styling and positioning.

### unwrapElement(element)
Removes the wrapper div around the input element.

## Example Usage

```javascript
const autoCompleteConfig = {
    selector: '#myInput',
    url: 'https://example.com/api/suggestions',
    key: 'name',
    maxResults: 5,
    manipulateData: (data) => {
        return data.features.map(feature => feature.properties);
    },
    onEventSelection: function(event, item) {
        const selectedObject = item;
        console.log(item.name)
    }
};

const myAutoComplete = new AutoComplete(autoCompleteConfig);
