import { createBrowserRouter } from 'react-router-dom';
import LoginFormPage from '../components/LoginFormPage';
import SignupFormPage from '../components/SignupFormPage';
import Layout from './Layout';
import Splash from '../components/Splash';
import CreateTripPage from '../components/CreateTripPage'; 
import TripDetailsPage from '../components/TripDetailsPage'; 
import EditTripPage from '../components/EditTripPage'; 

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      {
        path: "/",
        element: <Splash />,
      },
      {
        path: "login",
        element: <LoginFormPage />,
      },
      {
        path: "signup",
        element: <SignupFormPage />,
      },
      {
        path: "create-trip",
        element: <CreateTripPage />,
      },
      {
        path: "trips/:id",
        element: <TripDetailsPage />,
      },
      {
        path: "trips/:id/edit",
        element: <EditTripPage />,
      },
    ],
  },
]);