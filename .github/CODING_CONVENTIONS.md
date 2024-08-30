# Coding conventions

This document outlines the coding standards and best practices for our Vue 3 project using Vuetify. Adhering to these conventions will help maintain code quality, enhance readability, and ensure that our codebase is easy to maintain and scale.

Coding conventions are enforced through ESLint and Prettier. Make sure to install the necessary plugins in your code editor to ensure that your code adheres to the defined conventions.

## General Principles

1. **Consistency**: All contributors are expected to follow the agreed-upon styles and patterns defined in this document.
2. **Readability and Maintainability**: Write clear, understandable code that is easy to maintain and extend.
3. **Performance Considerations**: Always consider performance implications when writing your code.

## Vue and Vuetify Guidelines

### Use Vuetify Components

- **Prefer Vuetify Components**: Utilize Vuetify components over custom-built solutions to leverage built-in accessibility and maintain consistency across the project.
  ```vue
  <v-btn color="primary">Click me</v-btn>
  ```

### Utilize Vuetify helper functions

- **Grid System**: Use Vuetify's grid system to create responsive layouts.
  ```vue
  <v-row>
    <v-col cols="12" md="6">
      <!-- Content -->
    </v-col>
    <v-col cols="12" md="6">
      <!-- Content -->
    </v-col>
  </v-row>
  ```

- **Theme and Styling** Use Vuetify’s theming capabilities instead of hard-coded styles.
  ```vue
  <v-btn color="primary">Click me</v-btn>
  ```

- **Typography**: Use Vuetify typography classes for consistent text styling.
  ```vue
  <v-card-title class="text-caption">Title</v-card-title>
  ```

For more information, refer to the [Vuetify documentation](https://vuetifyjs.com/).

## JavaScript and TypeScript Guidelines

### Modern ES6+ Syntax

- **Arrow Functions**: Use ES6 arrow functions for anonymous functions or when you do not need `this` to be bound to the function.
  ```javascript
  const example = () => {
    console.log('ES6 arrow function');
  };
  ```

- **Template Literals**: Use template literals for string interpolation.
  ```javascript
    const name = 'John';
    console.log(`Hello, ${name}`);
  ```

- **Destructuring**: Use destructuring to extract values from objects and arrays.
  ```javascript
    const person = { name: 'John', age: 30 };
    const { name, age } = person;
  ```

- **Spread Operator**: Use the spread operator to copy arrays and objects.
  ```javascript
    const arr = [1, 2, 3];
    const copy = [...arr];
  ```

- **Semicolons**: Use semicolons to terminate statements.
  ```javascript
    const message = 'Hello, World!';
  ```

### TypeScript

- **Type Annotations**: Use TypeScript type annotations to define the types of variables, functions, and parameters.
  ```typescript
  const add = (a: number, b: number): number => a + b;
  ```

- **Interfaces**: Use interfaces to define object shapes.
  ```typescript
    interface Person {
        name: string;
        age: number;
    }
  ```

### Avoid Cosmetic Code Changes

- **Whitespace**: Avoid making whitespace changes.
- **Formatting**: Do not make formatting changes.
- **Comments**: Do not add new comments to already existing code.
- **Variable Renaming**: Do not rename variables.

## Additional Best Practices

### Component Design

- **Single File Components**: Store each Vue component in its own file.
- **Component Naming**: Use PascalCase for component names.
  ```html
  <template>
    <MyComponent />
  </template>
  ```

### Code Comments

- **Use Comments Sparingly:**: Write self-explanatory code and use comments only when necessary to explain the "why" behind a code decision.
- **Documentation:**: Document all major components and complex logic for future reference.

### Version Control

- **Commits**: Make small, frequent commits that clearly explain the changes or additions.
- **Pull Requests**: Create pull requests for new features or bug fixes. Use PR templates to provide context and details about the changes.


By adhering to these coding conventions, we ensure our project is not only functional but also scalable and maintainable. Happy coding!
