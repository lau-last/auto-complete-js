# AutoComplete Component

This repository contains the implementation of an `AutoComplete` component in JavaScript. This component enables an input field with autocomplete functionality, either by fetching suggestions from an API or by using a predefined array of suggestions.

## Features

- Fetches suggestions from an API or uses a predefined array.
- Displays a list of suggestions as the user types.
- Allows navigation through suggestions using keyboard arrows.
- Supports selection of suggestions using the Enter key or mouse click.
- Can be toggled on and off using a checkbox.

## Installation

To use the `AutoComplete` component in your project, you can include the source file and initialize it with the required configuration.

```html
<script src="path/to/AutoComplete.js"></script>
```

## Usage

Create an instance of the `AutoComplete` class by passing a configuration object. Below are the configuration options:

- **selector** (string, required): CSS selector for the input element.
- **url** (string, optional): URL for fetching suggestions from an API.
- **suggestion** (Array, optional): Array of suggestions.
- **activeAutoComplete** (boolean, optional): Boolean to enable or disable autocomplete. Default is `true`.
- **keys** (string, Array, function, optional): Key for accessing values in the suggestion objects.
- **maxResults** (number, optional): Maximum number of results to display.
- **onEventSelection** (function, optional): Callback function for selection events.
- **placeholder** (string, optional): Placeholder text for the input element. Default is `'Autocomplete enabled'`.
- **checkbox** (string, optional): CSS selector for a checkbox to toggle autocomplete.
- **inputLength** (number, optional): Input length to trigger autocomplete.
- **manipulateData** (function, optional): Function to manipulate data before display.

### Example

```javascript
const autoComplete = new AutoComplete({
    selector: '#myInput',
    url: 'https://api.example.com/suggestions?q=',
    maxResults: 5,
    inputLength: 3,
    placeholder: 'Start typing...',
    checkbox: '#myCheckbox',
    keys: ['firstname', 'lastname'],
    manipulateData: (data) => {
        return data.map(item => item.name)
    },
    onEventSelection: (event, item) => {
        document.querySelector('#myInput').value = item.name;
    },
});
```

## Development

To contribute to this project, follow these steps:

1. Fork the repository.
2. Create a new branch: `git checkout -b feature-branch`.
3. Make your changes and commit them: `git commit -m 'Add some feature'`.
4. Push to the branch: `git push origin feature-branch`.
5. Submit a pull request.

## Licence
```
Feel free to copy, modify the example paths and repository link according to your project structure and GitHub repository URL. Let me know if you need any further adjustments!
```