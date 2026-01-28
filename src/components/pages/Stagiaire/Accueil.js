// components/pages/Stagiaire/Dashboard.jsx
import { useAuth } from '../../../context/AuthContext';

const StagiaireDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        🎓 Bienvenue, {user?.name || 'Stagiaire'} !
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Statistiques */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-green-700 mb-2">📚 Cours Suivis</h3>
          <p className="text-3xl font-bold text-gray-800">8</p>
          <p className="text-sm text-gray-500 mt-2">Cours en cours</p>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-green-700 mb-2">✅ Progression</h3>
          <p className="text-3xl font-bold text-gray-800">65%</p>
          <p className="text-sm text-gray-500 mt-2">Progression globale</p>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-green-700 mb-2">📅 Prochain Cours</h3>
          <p className="text-2xl font-bold text-gray-800">14:00</p>
          <p className="text-sm text-gray-500 mt-2">JavaScript Avancé</p>
        </div>
      </div>

      {/* Cours en cours */}
      <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">📖 Mes Cours en Cours</h2>
        <div className="space-y-4">
          <div className="p-4 border rounded-lg hover:bg-green-50 transition">
            <h3 className="font-semibold text-green-700">JavaScript Avancé</h3>
            <p className="text-sm text-gray-600">Progression: 75%</p>
          </div>
          <div className="p-4 border rounded-lg hover:bg-green-50 transition">
            <h3 className="font-semibold text-green-700">React & Redux</h3>
            <p className="text-sm text-gray-600">Progression: 60%</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StagiaireDashboard;