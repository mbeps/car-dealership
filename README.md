# **Car Dealership Web App**

---

A full-stack web application for buying and selling cars.
With AI Car Marketplace, you can browse available vehicles, save your favorites, book test drives, and manage your car inventory.
The platform includes a complete admin portal for dealership management.

# Features
## Authentication
The system has several key user authentication and account management features designed to ensure that users have a seamless and secure experience:
- Users can sign up using email and password
- Users can log in using email and password
- Users can sign up and log in using third party providers (Google)
- Users can log out
- Profile management with automatic user creation

## Car Browsing and Search
The system has comprehensive car discovery features for users to find their perfect vehicle:
- Users can browse all available cars
- Users can filter cars by make, color, body type, fuel type, and transmission
- Users can filter by price range, mileage, and year
- Users can search for specific cars
- Users can view detailed car specifications and images
- Users can save cars to their wishlist
- Users can share car listings

## Test Drive Booking
The system allows users to schedule and manage test drives:
- Users can book test drives for available cars
- Users can select date and time based on dealership working hours
- Users can view their upcoming and past reservations
- Users can cancel test drive bookings
- Automated slot management prevents double bookings

## Admin Portal
The system provides a comprehensive admin interface for dealership management:
- Admins can view dashboard with key metrics and charts
- Admins can create, edit, and delete car listings
- Admins can upload multiple images per car
- Admins can mark cars as featured or change their status
- Admins can manage test drive bookings
- Admins can configure dealership information and contact details
- Admins can set working hours for each day of the week
- Admins can manage admin user accounts

# Stack
These are the main technologies that were used in this project:
## Front-End
- [**TypeScript**](https://www.typescriptlang.org/): TypeScript is a superset of JavaScript that adds optional static typing and other features to make the development of large-scale JavaScript applications easier and more efficient. TypeScript enables developers to catch errors earlier in the development process, write more maintainable code, and benefit from advanced editor support.
- [**Next.js**](https://nextjs.org/): Next.js is a popular React framework for building server-side rendered (SSR) and statically generated web applications. It provides a set of tools and conventions that make it easy to build modern, performant web applications that can be easily deployed to a variety of hosting environments.
- [**React**](https://react.dev/): React is a JavaScript library for building user interfaces. It provides a component-based architecture that makes it easy to build complex UIs from small, reusable pieces.
- [**Tailwind CSS**](https://tailwindcss.com/): a highly customizable, low-level CSS framework, provides utility classes that help us build out custom designs efficiently and responsively.
- [**Shadcn UI**](https://ui.shadcn.com/): Shadcn UI provides beautifully designed, accessible components built with Radix UI and Tailwind CSS. These components are customizable and integrate seamlessly into modern applications.
- [**Radix UI**](https://www.radix-ui.com/): Radix UI is a low-level, unstyled, and headless (renderless) UI component library. By being headless, Radix UI allows developers to create user interfaces with complete design freedom, providing functionality without dictating style. It delivers accessibility out-of-the-box, and works well with popular frameworks like React, thus fitting seamlessly into modern front-end development workflows.
- [**Embla Carousel**](https://www.embla-carousel.com/): Embla is a lightweight carousel library with fluid motion and great performance. It provides smooth, touch-friendly image galleries for car listings.
- [**React Hook Form**](https://react-hook-form.com/): React Hook Form provides performant, flexible forms with easy-to-use validation. It minimizes re-renders and simplifies form state management.
- [**Zod**](https://zod.dev/): Zod is a TypeScript-first schema validation library. It provides runtime type checking and validation for forms and API responses.

## Back-End
- [**Supabase**](https://supabase.io/): Supabase is a powerful open-source alternative to Google's Firebase. It provides a suite of tools and services that make it easy to build and scale complex applications, including real-time databases, authentication and authorization, storage, serverless functions, and more. Supabase uses PostgreSQL as its underlying database, providing a robust and reliable data layer for your application.
- [**PostgreSQL**](https://www.postgresql.org/): PostgreSQL is a powerful, open-source object-relational database system that uses and extends the SQL language combined with many features that safely store and scale the most complicated data workloads. PostgreSQL is known for its proven architecture, strong reliability, data integrity, and correctness. It's highly scalable both in the sheer quantity of data it can manage and in the number of concurrent users it can accommodate. It's utilized as the primary database for the Supabase services, bringing advanced functionalities and stability.
- [**Arcjet**](https://arcjet.com/): Arcjet provides bot detection and security shielding to protect the application from automated attacks and malicious traffic.

# Requirements
These are the requirements needed to run the project:
- Node 20 LTS or higher
- Yarn package manager
- Supabase account
- Arcjet account

# Running Application Locally
These are simple steps to run the application locally.

## 1. Clone the Project Locally
You'll first need to clone the project repository to your local machine. Open your terminal, navigate to the directory where you want to store the project, and run the following command:

```sh
git clone https://github.com/mbeps/car-dealership.git
```

## 2. Install Dependencies
Navigate to the root directory of the project by running the following command:
```sh
cd car-dealership
```

Then, install the project dependencies by running:
```sh
yarn install
```

## 3. Set Up Environment Variables
You'll need to set up your environment variables to run the application. In the root of your project, create a `.env.local` file. The environment variables you'll need to include are:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
ARCJET_KEY=
```

You'll need to fill in the value for each of these variables. Here's how to get each one:
- `NEXT_PUBLIC_SUPABASE_URL`: This is your Supabase project's unique URL. You can find this within your Supabase dashboard. Navigate to your project's settings and you will find the API URL listed there.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: This is the public publishable key for your Supabase project. It's located in your project's API settings and is safe to expose to the browser.
- `SUPABASE_SECRET_KEY`: This secret key replaces the legacy service role key naming. Handle it carefully as it grants broad privileges.
- `ARCJET_KEY`: This is your Arcjet API key for bot detection and security features. You can get this from your Arcjet dashboard after creating an account.

## 4. Set Up Supabase
To get your Supabase instance up and running, you'll need to do a few things:

1. **Run SQL queries**: Navigate to the `database` folder in your local project. In this folder, you'll find several SQL files containing the queries necessary to create tables and policies. You will need to run these SQL scripts inside your Supabase project in the following order:

   - `001_schema.sql` - Creates all database tables
   - `010_functions.sql` - Creates database functions and triggers
   - `020_policies.sql` - Sets up Row Level Security policies
   - `030_storage.sql` - Configures storage buckets and policies

   To do this, head to your Supabase dashboard and select the `SQL Editor` option from the left-hand panel. Here you can write or paste SQL scripts to be executed. Copy each query from your SQL files and run them in the Supabase editor.

2. **Enable authentication providers**: This app uses Email and Google as authentication providers. To enable these, head over to the `Authentication` section in your Supabase dashboard, click on `Providers` and then enable Email and Google OAuth. For Google OAuth, you'll need to configure your Google Cloud Console credentials.

3. **Create storage bucket**: The storage bucket `car-images` should be automatically created by the `030_storage.sql` script. If not, navigate to the `Storage` section in your Supabase dashboard, then click on the `New bucket` button. Fill in the bucket name as `car-images`, set it to public, and submit the form.

4. **Verify policies**: After running all SQL scripts, verify that Row Level Security is enabled on all tables and that the storage policies are correctly set. The policies should allow public read access for cars but restrict write operations to admin users only.

Remember, setting up your Supabase environment correctly is vital for your application to function as expected. Ensure you've followed each step closely.

## 5. Run the Application
Once you've set up your environment and its variables, you can run the application using the following command:

```sh
yarn dev
```

Alternatively, you can build the whole app and run it using the following commands:
```sh
yarn build 
yarn start
```

The application should now be running at [http://localhost:3000](http://localhost:3000).

# References
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Next.js Documentation](https://nextjs.org/docs)
- [React.js Documentation](https://react.dev/reference/react)
- [Supabase Documentation](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Shadcn UI Documentation](https://ui.shadcn.com/)
- [Radix UI Documentation](https://www.radix-ui.com/primitives/docs/overview/introduction)
- [React Hook Form Documentation](https://react-hook-form.com/get-started)
- [Zod Documentation](https://zod.dev/)
- [Arcjet Documentation](https://docs.arcjet.com/)
