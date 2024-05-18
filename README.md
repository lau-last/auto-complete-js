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
- **key** (string, optional): Key for accessing values in the suggestion objects.
- **maxResults** (number, optional): Maximum number of results to display.
- **onEventSelection** (function, optional): Callback function for selection events.
- **placeholder** (string, optional): Placeholder text for the input element. Default is `'Autocomplete enabled'`.
- **checkbox** (string, optional): CSS selector for a checkbox to toggle autocomplete.
- **manipulateData** (function, optional): Function to manipulate data before display.

### Example

```javascript
const autoComplete = new AutoComplete({
    selector: '#myInput',
    url: 'https://api.example.com/suggestions?q=',
    maxResults: 5,
    placeholder: 'Start typing...',
    onEventSelection: (event, item) => {
        console.log('Selected item:', item);
    },
    manipulateData: (data) => data.map(item => item.name)
});
```

## Best Practices

- **Modular Code**: Ensure your code is modular and reusable. Each function should have a single responsibility.
- **Debounce API Calls**: Use debounce to limit the number of API calls when the user is typing. This prevents unnecessary load on the server.
- **Error Handling**: Always handle errors gracefully. Provide feedback to the user in case of network issues or other errors.
- **Accessibility**: Make sure the component is accessible. Use appropriate ARIA attributes and ensure keyboard navigation works correctly.
- **Customization**: Provide configuration options to make the component flexible and customizable for different use cases.
- **Performance Optimization**: Optimize performance by limiting the number of results displayed and efficiently managing event listeners.

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