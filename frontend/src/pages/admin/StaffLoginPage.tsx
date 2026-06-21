import { useEffect, useId, useState, type FormEvent } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import { AuthCard, Field, LocaleButton } from '../../components/shared';
import type { StateSetter } from '../../types/app';
import type { Locale, StaffSession, TFunction } from '../../types/domain';

type StaffLoginPageProps = {
  locale: Locale;
  setLocale: StateSetter<Locale>;
  t: TFunction;
  staffSession: StaffSession;
  setStaffSession: StateSetter<StaffSession>;
};

export default function StaffLoginPage({ locale, setLocale, t, staffSession, setStaffSession }: StaffLoginPageProps) {
  const location = useLocation();
  const usernameId = useId();
  const passwordId = useId();
  const errorId = useId();
  const [username, setUsername] = useState(staffSession.username || 'admin');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const hasError = Boolean(error);

  useEffect(() => {
    document.body.classList.remove('customer-page');
    document.body.classList.add('admin-page');
    document.title = `${t('brand.name')} - ${t('staffLogin.pageTitle')}`;
  }, [t]);

  if (staffSession.isAuthenticated) {
    return <Navigate to={`/admin/requests${location.search}`} replace />;
  }

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!username.trim() || password.length < 4) {
      setError(t('staffLogin.errorRequired'));
      return;
    }
    setError('');
    setStaffSession({ isAuthenticated: true, username: username.trim() });
  };

  return (
    <main className="staff-login-page">
      <AuthCard
        className="staff-login-card"
        kicker={t('staffLogin.kicker')}
        mark={<span className="staff-login-mark">CR</span>}
        title={t('brand.name')}
        copy={t('staffLogin.copy')}
      >
        <form className="staff-login-form" onSubmit={onSubmit} noValidate>
          <div className="staff-login-fields">
            <Field label={t('staffLogin.username')} htmlFor={usernameId}>
              <input
                id={usernameId}
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                autoComplete="username"
                aria-invalid={hasError || undefined}
                aria-describedby={hasError ? errorId : undefined}
              />
            </Field>
            <Field label={t('staffLogin.password')} htmlFor={passwordId}>
              <div className="password-field-shell">
                <input
                  id={passwordId}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  aria-invalid={hasError || undefined}
                  aria-describedby={hasError ? errorId : undefined}
                />
                <button
                  className="password-reveal-button"
                  type="button"
                  aria-label={t(showPassword ? 'staffLogin.hidePassword' : 'staffLogin.revealPassword')}
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword((current) => !current)}
                >
                  {showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
                </button>
              </div>
            </Field>
          </div>
          <div className="staff-login-feedback" aria-live="polite">
            {hasError ? (
              <p className="validation-message staff-login-error" id={errorId} role="alert">
                <AlertCircle aria-hidden="true" />
                <span>{error}</span>
              </p>
            ) : (
              <span aria-hidden="true" />
            )}
          </div>
          <button className="primary-button full" type="submit">{t('staffLogin.submit')}</button>
        </form>
        <div className="staff-login-utility" aria-label={t('staffLogin.utilityLabel')}>
          <LocaleButton locale={locale} setLocale={setLocale} t={t} />
          <span className="staff-login-utility-note">{t('staffLogin.environment')}</span>
        </div>
      </AuthCard>
    </main>
  );
}
