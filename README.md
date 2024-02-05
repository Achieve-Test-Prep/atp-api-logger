# ATP Logger Utility

The ATP Logger Utility is a tool designed to log API calls for analysis purposes. It provides a convenient way to track and monitor API requests and responses within your projects.

## Installation

To install the ATP Logger Utility in your project using npm, follow these steps:

1. Open your terminal or command prompt.
2. Navigate to your project directory.
3. Run the following command to install the ATP Logger Utility:

   ```shell
   npm install atp-api-logger
   ```

   This will download and install the package from the npm registry.

4. Once the installation is complete, you can import and use the ATP Logger Utility in your project as follows:

   ```javascript
   import { Logger, SupportedProducts } from "atp-api-logger";

   // Define condition to enable logging
   const isEnabled = process.env.REACT_APP_ENVIRONMENT === "production";

   // Get the instance of the logger for a specific product
   export const logger = Logger.getInstance(
     SupportedProducts.PREP_PORTAL,
     isEnabled
   );

   // Use the logger instance to set id (customer_id or lead_id)
   logger.setId({ lead_id: lid });
   // OR
   logger.setId({ customer_id: cid });

   // Now use the logger instance to track any api calls
   logger.trackPromise(promise as Promise<PromiseResponse>, { api_name: "/me", method: "GET", server_type: SupportedServerTypes.PREP });

   // Clear logger's session id on logout
   logger.clearSession();
   ```

Note: Make sure you have Node.js and npm installed on your system before proceeding with the installation.

## Running Scripts from package.json

The ATP Logger Utility provides several scripts that can be executed from the package.json file. Here are two commonly used scripts:

### "build" script

The "build" script is used to build a plain JS file, a minified JS file, and an index.d.ts file for TS definitions. To run the "build" script, follow these steps:

1. Open your terminal or command prompt.
2. Navigate to your project directory.
3. Run the following command:

   ```shell
   npm run build
   ```

   This will execute the "build" script defined in the package.json file. It will create the build files in the "dist" folder.

### "publish" script

The "publish" script is used to publish a new release on npm. Before running the "publish" script, make sure to bump up the version in the package.json file. To publish a new release, follow these steps:

1. Open your terminal or command prompt.
2. Navigate to your project directory.
3. Run the following command:

   ```shell
   npm run publish
   ```

   This will execute the "publish" script defined in the package.json file and publish the new release on npm.

Note: Make sure you have the necessary permissions and credentials to publish a new release on npm.
