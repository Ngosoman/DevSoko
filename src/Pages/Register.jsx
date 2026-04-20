import Navbar from "../Components/Shared/Navbar";
import RegisterForm from "../Components/Auth/RegisterForm";

const Register = () => {
  return (
    <>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex items-center justify-center transition-colors duration-300">
        <RegisterForm />
      </div>
    </>
  );
};

export default Register;
