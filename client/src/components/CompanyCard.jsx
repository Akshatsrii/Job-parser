import { Link } from "react-router-dom";

const CompanyCard = ({ company }) => {
  const { _id, companyName, logo, location, salary, experience, hiringFor, workingHours } = company;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center gap-4 mb-4">
        {logo ? (
          <img src={logo} alt={companyName} className="w-14 h-14 object-contain rounded-lg border border-gray-200 p-1" />
        ) : (
          <div className="w-14 h-14 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xl border border-blue-100">
            {companyName?.charAt(0)}
          </div>
        )}
        <div>
          <h2 className="text-lg font-semibold text-gray-800">{companyName}</h2>
          <p className="text-sm text-gray-500">📍 {location}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {hiringFor?.slice(0, 2).map((role, i) => (
          <span key={i} className="px-3 py-1 bg-blue-50 text-blue-600 text-xs rounded-full font-medium">
            {role}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm text-gray-500 mb-5">
        {salary && <div>💰 {salary}</div>}
        {experience && <div>🧑‍💼 {experience}</div>}
        {workingHours && <div>🕐 {workingHours}</div>}
      </div>

      <Link
        to={`/company/${_id}`}
        className="block w-full text-center py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
      >
        View Details
      </Link>
    </div>
  );
};

export default CompanyCard;