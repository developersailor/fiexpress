export const cssFrameworkConfig = {
  framework: 'bootstrap',
  package: 'bootstrap',
  version: '^5.3.0',
  cdn: 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css',
  js: 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js',
  icons: 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css',
  
  // Framework-specific configuration
  config: {},
  
  // Build configuration
  build: {
    source: 'src/scss/',
    output: 'public/css/',
    watch: process.env.NODE_ENV === 'development'
  },
  
  // Custom variables
  variables: {
    primary: '#007bff',
    secondary: '#6c757d',
    success: '#28a745',
    danger: '#dc3545',
    warning: '#ffc107',
    info: '#17a2b8',
    light: '#f8f9fa',
    dark: '#343a40'
  },
  
  // Responsive breakpoints
  breakpoints: {
    xs: '0px',
    sm: '576px',
    md: '768px',
    lg: '992px',
    xl: '1200px',
    xxl: '1400px'
  }
};

export default cssFrameworkConfig;