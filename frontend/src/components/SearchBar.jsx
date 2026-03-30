import "./SearchBar.css";

export default function SearchBar() {
  return (
    <div className="search-bar">
      <input type="text" placeholder="Search for games..." />
      <button>Search</button>
    </div>
  );
}
