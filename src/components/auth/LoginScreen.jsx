import { useGoogleLogin } from '@react-oauth/google';
import { useTheme } from '../../hooks/useTheme';
import { DuplaLogo } from '../DuplaLogo';

export default function LoginScreen({ onLogin }) {
  const { C, Sx } = useTheme();
  const login = useGoogleLogin({
    onSuccess: (tokenResponse) => onLogin(tokenResponse.access_token),
    onError: (err) => console.error('Login error', err),
    scope: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive.file',
    ].join(' '),
  });

  return (
    <div style={{
      display:'flex', flexDirection:'column', alignItems:'center',
      justifyContent:'center', minHeight:'100vh', background:C.bg,
      padding:'32px 24px',
    }}>
      {/* Brand */}
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', marginBottom: 48 }}>
        <DuplaLogo size={56} />
        <div style={{ marginTop:14, fontSize:28, fontWeight:500, color:C.gray1, letterSpacing:'-0.6px' }}>dupla</div>
        <div style={{ fontSize:14, color:C.gray3, marginTop:6 }}>Finanzas compartidas para dos</div>
      </div>

      {/* Card */}
      <div style={{
        ...Sx.card,
        padding:'28px 24px', width:'100%', maxWidth:360, marginBottom:0,
        boxShadow:'0 4px 24px rgba(0,0,0,0.07)',
      }}>
        <div style={{ fontSize:15, fontWeight:500, color:C.gray1, marginBottom:6, textAlign:'center' }}>
          Conectá tu cuenta de Google
        </div>
        <div style={{ fontSize:13, color:C.gray3, marginBottom:24, textAlign:'center', lineHeight:1.6 }}>
          Tus datos se guardan en un Google Sheet de tu propio Drive.
        </div>

        {/* Google button */}
        <button
          onClick={() => login()}
          style={{
            width:'100%', padding:'14px 20px', background:C.white,
            border:`0.5px solid ${C.border}`, borderRadius:10,
            fontSize:14, fontWeight:500, color:C.gray1,
            cursor:'pointer', display:'flex', alignItems:'center',
            justifyContent:'center', gap:10,
            boxShadow:'0 1px 4px rgba(0,0,0,0.06)',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.2l6.7-6.7C35.8 2.5 30.2 0 24 0 14.6 0 6.6 5.4 2.5 13.3l7.8 6C12.4 13.2 17.8 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17z"/>
            <path fill="#FBBC05" d="M10.3 28.7A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.8-4.7l-7.8-6A23.9 23.9 0 0 0 0 24c0 3.9.9 7.5 2.5 10.7l7.8-6z"/>
            <path fill="#34A853" d="M24 48c6.2 0 11.4-2 15.2-5.5l-7.5-5.8c-2 1.4-4.6 2.2-7.7 2.2-6.2 0-11.5-4.2-13.4-9.8l-7.8 6C6.6 42.6 14.6 48 24 48z"/>
          </svg>
          Continuar con Google
        </button>

        <div style={{ marginTop:20, padding:'12px 14px', background:C.sageL, borderRadius:10, border:`0.5px solid ${C.sage}33` }}>
          <div style={{ fontSize:12, color:C.sage, fontWeight:500, marginBottom:4 }}>Tu privacidad, garantizada</div>
          <div style={{ fontSize:11, color:C.gray3, lineHeight:1.6 }}>
            Solo pedimos acceso a Sheets para crear y leer <em>tu propio archivo</em>. No almacenamos tus datos en ningún servidor externo.
          </div>
        </div>
      </div>
    </div>
  );
}
