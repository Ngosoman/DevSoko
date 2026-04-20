import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);

  useEffect(() => {
    const storedProjects = JSON.parse(localStorage.getItem("uploadedProjects")) || [];
    const foundProject = storedProjects.find((proj) => proj.id === id);

    if (foundProject) {
      setProject(foundProject);
    }
  }, [id]);

  const handleBuyNow = () => {
    navigate(`/checkout/${id}`);
  };

  if (!project) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex items-center justify-center p-6 transition-colors duration-300">
        <div className="text-center text-xl font-semibold">Project not found!</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-6 transition-colors duration-300">
      <div className="max-w-4xl mx-auto p-6 bg-white dark:bg-slate-900 dark:border dark:border-slate-800 rounded-lg shadow-lg mt-8">
        <img src={project.image || '/placeholder.jpg'} alt={project.title} className="w-full h-64 object-cover rounded-md mb-4" />
        <h1 className="text-2xl font-bold mb-2 text-slate-900 dark:text-slate-100">{project.title}</h1>
        <p className="text-slate-700 dark:text-slate-300 mb-2"><strong>Seller:</strong> {project.sellerName || 'Anonymous'}</p>
        <p className="text-slate-700 dark:text-slate-300 mb-4"><strong>Description:</strong> {project.description}</p>
        <p className="text-emerald-600 dark:text-emerald-400 text-xl font-semibold mb-4">Ksh {project.price}</p>
        <button
          onClick={handleBuyNow}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          Buy Now
        </button>
      </div>
    </div>
  );
};

export default ProjectDetails;
