import { FaGamepad } from "react-icons/fa";
import "./SearchBar.css";

export default function SearchBar({ value, onChange }) {
  return (
    <div className="home-search-tools">
      <div className="home-search-box">
        <FaGamepad />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search by title or App ID"
        />
      </div>
    </div>
  );
}
