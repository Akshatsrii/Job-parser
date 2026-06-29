import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getCompanyById } from "../services/companyApi";

const CompanyDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const res = await getCompanyById(id);
        setCompany(res.data.data);
      } catch (err) {
        setError("Company nahi mili.");
      } finally {
        setLoading(false);
      }
    };
    fetchCompany();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500">
        <p>{error || "Company not found"}</p>
      </div>
    );
  }

  const { companyName, logo, location, language, workingHours, website, description, hiringFor, experience, salary } = company;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 mb-6 transition-colors"
      >
        ← Back to Companies
      </button>

      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-center gap-5 mb-5">
          {logo ? (
            <img src={logo} alt={companyName} className="w-20 h-20 object-contain rounded-xl border border-gray-200 p-2" />
          ) : (
            <div className="w-20 h-20 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-3xl border border-blue-100">
              {companyName?.charAt(0)}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{companyName}</h1>
            <p className="text-gray-500 mt-1">📍 {location}</p>
            {website && (
              <a href={website} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-sm hover:underline mt-1 inline-block">
                🌐 {website}
              </a>
            )}
          </div>
        </div>
        {description && <p className="text-gray-600 text-sm leading-relaxed">{description}</p>}
      </div>

      {/* Details Grid */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Job Details</h2>
        <div className="grid grid-cols-2 gap-4">
          {salary && (
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-xs text-gray-400 mb-1">Salary</p>
              <p className="text-sm font-semibold text-gray-700">💰 {salary}</p>
            </div>
          )}
          {experience && (
            <div className="bg-purple-50 rounded-lg p-4">
              <p className="text-xs text-gray-400 mb-1">Experience</p>
              <p className="text-sm font-semibold text-gray-700">🧑‍💼 {experience}</p>
            </div>
          )}
          {workingHours && (
            <div className="bg-orange-50 rounded-lg p-4">
              <p className="text-xs text-gray-400 mb-1">Working Hours</p>
              <p className="text-sm font-semibold text-gray-700">🕐 {workingHours}</p>
            </div>
          )}
          {language && (
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-xs text-gray-400 mb-1">Language</p>
              <p className="text-sm font-semibold text-gray-700">🗣️ {language}</p>
            </div>
          )}
        </div>
      </div>

      {/* Hiring For */}
      {hiringFor?.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Hiring For</h2>
          <div className="flex flex-wrap gap-2">
            {hiringFor.map((role, i) => (
              <span key={i} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-full font-medium">
                {role}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyDetails;