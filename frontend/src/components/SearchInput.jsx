function SearchInput({ searchText, setSearchText }) {
  return (
    <input
      type="text"
      placeholder="Search player name"
      value={searchText}
      onChange={(event) => setSearchText(event.target.value)}
    />
  );
}

export default SearchInput;
