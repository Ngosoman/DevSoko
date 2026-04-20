import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import UploadForm from "../Components/Project/UploadForm";
import useUserRole from "../hooks/useUserRole";
import { supabase } from "../supabaseClient";

const UploadProject = () => {
  const { role, loading } = useUserRole();
  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
      } else if (role !== "seller") {
        alert("Only sellers can upload projects.");
        navigate("/projects");
      }
    };

    if (!loading) {
      checkUser();
    }
  }, [loading, role, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex items-center justify-center transition-colors duration-300">
        <p className="text-slate-600 dark:text-slate-300 text-lg">Checking access...</p>
      </div>
    );
  }

  return (
    <>
     
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex items-center justify-center p-4 transition-colors duration-300">
        <UploadForm />
      </div>
    </>
  );
};

export default UploadProject;
