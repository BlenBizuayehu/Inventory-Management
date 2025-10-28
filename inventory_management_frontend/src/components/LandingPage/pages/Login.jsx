import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";

function Login() {

    const [username, setUsername]=useState("");
    const [password, setPassword]=useState("");
    const [error, setError]= useState("");
    const [success, setSuccess]=useState("");
    const [isLoggedIn, setIsLoggedIn]= useState(false);
    const navigate = useNavigate();

    const login=async(e)=>{
        e.preventDefault();

        if (!username || !password) {
        setError("Please enter both username and password.");
        return;
        }

        try {
            const response=await fetch("http://localhost:5000/api/users/login",{
                method:"POST",
                headers:{
                    "Content-Type":"application/json"
                },
                body:JSON.stringify({
                    username:username,
                    password:password
                }),
            });

            const data=await response.json();

            if(response.status==200){
                setSuccess("Login Successful");
                localStorage.setItem("token", data.token);
                setIsLoggedIn(true);
                navigate("/owner/dashboard/overview");
            }
            else{
                setError(data.message|| "Login Failed");
            }
        } catch (err) {
            console.error("Error during login:", err);
            setError("An error occured. PLease try again.")
        }
    }

  return (
    <div className="login-page">
      <div className="login-box">
        <h2>Login</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={login}>
          <div className="input-group">
            <label htmlFor="username">Username</label>
            <input 
            type="text" 
            id="username" 
            value={username} 
            onChange={(e)=>setUsername(e.target.value)} 
            placeholder="Enter your username" />
          </div>
          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input 
            type="password" 
            id="password"  
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password" />
        </div>
        <button type="submit" className="btn-submit">Login</button>
        {success && <div className="success-message">{success}</div>}
        </form>
      </div>
    </div>
  );
}

export default Login;
