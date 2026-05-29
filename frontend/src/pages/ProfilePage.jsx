import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_URL } from "../utils/apiConfig";
import TeamCard from "../components/TeamCard";
import { mlbTeams } from "../services/mlbTeams";
import { clearAuthData, getAuthToken, saveAuthUserName } from "../utils/authStorage";
import {
  getCurrentUser,
  updateProfile,
  updateFavoriteTeam,
  uploadAvatar,
  changePassword,
  deleteAccount,
} from "../services/api/userApi";
import { getFavorites } from "../services/api/favoriteApi";
import {
  getApiErrorMessage,
  isUnauthorizedError,
} from "../services/api/apiError";

function ProfilePage() {
  const [user, setUser] = useState(null);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [nameSaving, setNameSaving] = useState(false);
  const [nameError, setNameError] = useState("");

  const [editingTeam, setEditingTeam] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [teamSaving, setTeamSaving] = useState(false);
  const [teamError, setTeamError] = useState("");

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteEmail, setDeleteEmail] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const fileInputRef = useRef(null);

  const token = getAuthToken();
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) { navigate("/login"); return; }
    const fetchData = async () => {
      try {
        setLoading(true);
        const [userData, favorites] = await Promise.all([
          getCurrentUser(token),
          getFavorites(token),
        ]);
        setUser(userData);
        setFavoritesCount(favorites.length);
      } catch (err) {
        if (isUnauthorizedError(err)) { clearAuthData(); navigate("/login"); }
        else setError(getApiErrorMessage(err));
      } finally { setLoading(false); }
    };
    fetchData();
  }, [token, navigate]);

  const handleAvatarClick = () => fileInputRef.current.click();
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setAvatarUploading(true);
      setAvatarError("");
      const updated = await uploadAvatar(file, token);
      setUser(updated);
    } catch (err) {
      setAvatarError(getApiErrorMessage(err));
    } finally {
      setAvatarUploading(false);
      e.target.value = "";
    }
  };

  const handleStartEditName = () => { setNameInput(user.name); setNameError(""); setEditingName(true); };
  const handleCancelEditName = () => { setEditingName(false); setNameError(""); };
  const handleSaveName = async () => {
    if (!nameInput.trim()) { setNameError("Name cannot be empty."); return; }
    try {
      setNameSaving(true); setNameError("");
      const updated = await updateProfile({ name: nameInput.trim() }, token);
      setUser(updated); saveAuthUserName(updated.name); setEditingName(false);
    } catch (err) { setNameError(getApiErrorMessage(err)); }
    finally { setNameSaving(false); }
  };

  const handleStartEditTeam = () => { setSelectedTeam(user.favoriteTeam?.id ? user.favoriteTeam : null); setTeamError(""); setEditingTeam(true); };
  const handleCancelEditTeam = () => { setEditingTeam(false); setTeamError(""); setSelectedTeam(null); };
  const handleSaveTeam = async () => {
    if (!selectedTeam) { setTeamError("Please select a team."); return; }
    try {
      setTeamSaving(true); setTeamError("");
      const updated = await updateFavoriteTeam(selectedTeam, token);
      setUser(updated); setEditingTeam(false); setSelectedTeam(null);
    } catch (err) { setTeamError(getApiErrorMessage(err)); }
    finally { setTeamSaving(false); }
  };

  const handleOpenPasswordForm = () => { setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); setPasswordError(""); setPasswordSuccess(""); setShowPasswordForm(true); };
  const handleCancelPassword = () => { setShowPasswordForm(false); setPasswordError(""); setPasswordSuccess(""); };
  const handleSavePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) { setPasswordError("Please fill in all fields."); return; }
    if (newPassword.length < 6) { setPasswordError("New password must be at least 6 characters."); return; }
    if (newPassword !== confirmPassword) { setPasswordError("New passwords do not match."); return; }
    try {
      setPasswordSaving(true); setPasswordError("");
      await changePassword({ currentPassword, newPassword }, token);
      setPasswordSuccess("Password updated successfully.");
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
      setTimeout(() => { setShowPasswordForm(false); setPasswordSuccess(""); }, 2000);
    } catch (err) { setPasswordError(getApiErrorMessage(err)); }
    finally { setPasswordSaving(false); }
  };

  const handleOpenDeleteConfirm = () => { setDeleteEmail(""); setDeleteError(""); setShowDeleteConfirm(true); };
  const handleCancelDelete = () => { setShowDeleteConfirm(false); setDeleteError(""); };
  const handleDeleteAccount = async () => {
    if (deleteEmail !== user.email) { setDeleteError("Email does not match. Please try again."); return; }
    try {
      setDeleting(true);
      await deleteAccount(token);
      clearAuthData(); navigate("/login");
    } catch (err) { setDeleteError(getApiErrorMessage(err)); setDeleting(false); }
  };

  if (loading) return <div className="home-page px-6 py-12"><p className="text-ctp-subtext0 text-sm">Loading profile…</p></div>;
  if (error)   return <div className="home-page px-6 py-12"><p className="text-ctp-red text-sm">{error}</p></div>;
  if (!user)   return null;

  const initials = user.name
    ? user.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  return (
    <div className="home-page px-6 py-12">

      {/* ── Hero（他ページと同じ構造） ── */}
      <section className="home-hero w-full max-w-2xl px-8 py-10 md:px-12 md:py-12">
        {editingName ? (
          <div className="profile-hero-edit">
            <input
              className="profile-name-input"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
              autoFocus maxLength={50}
            />
            {nameError && <p className="profile-field-error">{nameError}</p>}
            <div className="profile-edit-actions profile-edit-actions--centered">
              <button className="profile-btn profile-btn--save" onClick={handleSaveName} disabled={nameSaving}>{nameSaving ? "Saving…" : "Save"}</button>
              <button className="profile-btn profile-btn--cancel" onClick={handleCancelEditName} disabled={nameSaving}>Cancel</button>
            </div>
          </div>
        ) : (
          <div className="profile-hero-name-row">
            <h1 className="text-4xl font-black tracking-tight md:text-5xl">
              {user.name}
            </h1>
            <button className="profile-pencil-btn" onClick={handleStartEditName} title="Edit name">✎</button>
          </div>
        )}

        <p className="home-description mt-3 text-base">{user.email}</p>

        {/* YOUR ACCOUNT カード（hero下部） */}
        <div className="profile-identity-card">
          <p className="home-kicker text-xs">Your Account</p>
          <button
            className={`profile-hero-avatar profile-hero-avatar--btn ${avatarUploading ? "profile-hero-avatar--loading" : ""}`}
            onClick={handleAvatarClick}
            title="Change profile picture"
            disabled={avatarUploading}
          >
            {user.avatarUrl ? (
              <img
                src={`${API_URL}${user.avatarUrl}`}
                alt={user.name}
                className="profile-avatar-img"
              />
            ) : (
              avatarUploading ? "…" : initials
            )}
            <span className="profile-avatar-overlay">
              {avatarUploading ? "Uploading…" : "Change"}
            </span>
          </button>
          {avatarError && <p className="profile-field-error" style={{ marginTop: 6 }}>{avatarError}</p>}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleAvatarChange}
          />
        </div>
      </section>

      {/* ── Content（他ページと同じ構造） ── */}
      <div className="home-content mt-2 w-full">
        <div className="profile-grid">

          {/* Favorite Team */}
          <div className="profile-card profile-card--team">
            <p className="profile-card-label">Favorite Team</p>
            {!editingTeam ? (
              <>
                {user.favoriteTeam?.id ? (
                  <div className="profile-team-row">
                    <img
                      src={`https://www.mlbstatic.com/team-logos/${user.favoriteTeam.id}.svg`}
                      alt={user.favoriteTeam.name}
                      className="profile-team-logo"
                      onError={(e) => { e.currentTarget.style.display = "none"; }}
                    />
                    <div>
                      <p className="profile-team-name">{user.favoriteTeam.name}</p>
                      <p className="profile-team-abbr">{user.favoriteTeam.abbreviation}</p>
                    </div>
                  </div>
                ) : (
                  <p className="profile-empty-hint">No team selected</p>
                )}
                <button className="profile-action-btn" onClick={handleStartEditTeam}>Change Team</button>
              </>
            ) : (
              <div className="profile-team-picker">
                <div className="profile-team-grid">
                  {mlbTeams.map((team) => (
                    <TeamCard key={team.id} team={team} selected={selectedTeam?.id === team.id} handleSelectTeam={setSelectedTeam} />
                  ))}
                </div>
                {teamError && <p className="profile-field-error">{teamError}</p>}
                <div className="profile-edit-actions">
                  <button className="profile-btn profile-btn--save" onClick={handleSaveTeam} disabled={teamSaving}>{teamSaving ? "Saving…" : "Save Team"}</button>
                  <button className="profile-btn profile-btn--cancel" onClick={handleCancelEditTeam} disabled={teamSaving}>Cancel</button>
                </div>
              </div>
            )}
          </div>

          {/* My Stats */}
          <div className="profile-card profile-card--stats">
            <p className="profile-card-label">My Stats</p>
            <div className="profile-stat-row">
              <span className="profile-stat-icon">★</span>
              <div>
                <p className="profile-stat-value">{favoritesCount}</p>
                <p className="profile-stat-desc">Favorite Players</p>
              </div>
            </div>
            <Link to="/favorites" className="profile-card-link">View Favorites →</Link>
          </div>

          {/* Security */}
          <div className="profile-card profile-card--security profile-card--full">
            <p className="profile-card-label">Security</p>
            {!showPasswordForm ? (
              <div className="profile-security-row">
                <p className="profile-security-desc">Update your password to keep your account safe.</p>
                <button className="profile-action-btn profile-action-btn--secondary" onClick={handleOpenPasswordForm}>Change Password</button>
              </div>
            ) : (
              <div className="profile-password-form">
                <div className="profile-password-fields">
                  <input className="profile-field-input" type="password" placeholder="Current password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} autoFocus />
                  <input className="profile-field-input" type="password" placeholder="New password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                  <input className="profile-field-input" type="password" placeholder="Confirm new password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSavePassword()} />
                </div>
                {passwordError && <p className="profile-field-error">{passwordError}</p>}
                {passwordSuccess && <p className="profile-field-success">{passwordSuccess}</p>}
                <div className="profile-edit-actions">
                  <button className="profile-btn profile-btn--save" onClick={handleSavePassword} disabled={passwordSaving}>{passwordSaving ? "Saving…" : "Update Password"}</button>
                  <button className="profile-btn profile-btn--cancel" onClick={handleCancelPassword} disabled={passwordSaving}>Cancel</button>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* ── Danger Zone ── */}
        <div className="profile-danger-section">
          <p className="profile-danger-section-title">Danger Zone</p>
          <div className="profile-danger-card">
            {!showDeleteConfirm ? (
              <div className="profile-danger-row">
                <div>
                  <p className="profile-danger-card-title">Delete Account</p>
                  <p className="profile-danger-desc">Permanently delete your account and all favorites. This cannot be undone.</p>
                </div>
                <button className="profile-btn--danger-outline" onClick={handleOpenDeleteConfirm}>Delete Account</button>
              </div>
            ) : (
              <div className="profile-delete-confirm">
                <p className="profile-danger-desc">
                  Type your email <strong className="text-ctp-text">{user.email}</strong> to confirm.
                </p>
                <input
                  className="profile-field-input profile-field-input--danger"
                  type="email"
                  placeholder={user.email}
                  value={deleteEmail}
                  onChange={(e) => setDeleteEmail(e.target.value)}
                  autoFocus
                />
                {deleteError && <p className="profile-field-error">{deleteError}</p>}
                <div className="profile-edit-actions">
                  <button className="profile-btn profile-btn--danger" onClick={handleDeleteAccount} disabled={deleting}>{deleting ? "Deleting…" : "Yes, Delete My Account"}</button>
                  <button className="profile-btn profile-btn--cancel" onClick={handleCancelDelete} disabled={deleting}>Cancel</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}

export default ProfilePage;
