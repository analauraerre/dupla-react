import { useGoogleLogin } from '@react-oauth/google';
import { C } from '../../utils/constants';

export default function LoginScreen({ onLogin }) {
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
      justifyContent:'center', minHeight:'100vh', background:C.gray6,
      padding:'32px 24px', fontFamily:"'Helvetica Neue',Arial,sans-serif"
    }}>
      <div style={{fontSize:64, marginBottom:16}}>👫</div>
      <div style={{fontSize:32, fontWeight:900, color:C.gray1, letterSpacing:'-1px', marginBottom:8}}>Dupla</div>
      <div style={{fontSize:15, color:C.gray3, marginBottom:48, textAlign:'center', maxWidth:280}}>
        Finanzas compartidas para dos personas
      </div>

      <div style={{
        background:C.white, borderRadius:24, padding:'32px 28px',
        boxShadow:'0 4px 24px rgba(0,0,0,0.08)', width:'100%', maxWidth:360
      }}>
        <div style={{fontSize:16, fontWeight:700, color:C.gray1, marginBottom:8, textAlign:'center'}}>
          Conectá tu cuenta de Google
        </div>
        <div style={{fontSize:13, color:C.gray3, marginBottom:28, textAlign:'center', lineHeight:1.5}}>
          Tus datos se guardan en un Google Sheet de tu propio Drive. Nadie más puede acceder a ellos.
        </div>

        <button
          onClick={() => login()}
          style={{
            width:'100%', padding:'14px', background:C.white,
            border:`2px solid ${C.border}`, borderRadius:14,
            fontSize:15, fontWeight:700, color:C.gray1,
            cursor:'pointer', display:'flex', alignItems:'center',
            justifyContent:'center', gap:12,
            boxShadow:'0 2px 8px rgba(0,0,0,0.06)',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.2l6.7-6.7C35.8 2.5 30.2 0 24 0 14.6 0 6.6 5.4 2.5 13.3l7.8 6C12.4 13.2 17.8 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17z"/>
            <path fill="#FBBC05" d="M10.3 28.7A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.8-4.7l-7.8-6A23.9 23.9 0 0 0 0 24c0 3.9.9 7.5 2.5 10.7l7.8-6z"/>
            <path fill="#34A853" d="M24 48c6.2 0 11.4-2 15.2-5.5l-7.5-5.8c-2 1.4-4.6 2.2-7.7 2.2-6.2 0-11.5-4.2-13.4-9.8l-7.8 6C6.6 42.6 14.6 48 24 48z"/>
          </svg>
          Continuar con Google
        </button>

        <div style={{marginTop:24, padding:'14px', background:C.sageL, borderRadius:12}}>
          <div style={{fontSize:12, color:C.sage, fontWeight:600, marginBottom:6}}>🔒 Tu privacidad, garantizada</div>
          <div style={{fontSize:11, color:C.gray3, lineHeight:1.6}}>
            Solo pedimos acceso a Google Sheets y Drive para crear y leer <em>tu propio archivo</em>. No compartimos ni almacenamos tus datos en ningún servidor externo.
          </div>
        </div>
      </div>
    </div>
  );
}
