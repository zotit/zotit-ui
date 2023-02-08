import { API_URL } from "../config.js";

const username = {
    label: 'Username',
    placeholder: 'Username / Email address',
    autofocus: false,
    type: "text",
    value: '',
    error: ''
}

const password = {
    label: 'Password',
    placeholder: 'Please enter a strong password',
    type: "password",
    autofocus: false,
    value: '',
    error: ''
}

function login() {
    if(!(!username.error && !password.error)){
        return;
    }
    m.request({
            method: 'POST',
            url: API_URL+'/login',
            body:{
                username:username.value,
                password:password.value
            }
        })
        .then(function (result) {
            Login.apiError = false;
            if(result.token && result.token!= ""){
                localStorage.setItem("token",result.token)
                m.route.set("/home")
            }
        })
        .catch(function (e) {
            Login.apiError = e.toString()
        });
}
function signup() {
    if(!(!username.error && !password.error)){
        return;
    }
    m.request({
            method: 'POST',
            url: API_URL+'/register',
            body:{
                username:username.value,
                password:password.value
            }
        })
        .then(function (result) {
            Login.apiError = false;
            if(result.token && result.token!= ""){
                localStorage.setItem("token",result.token)
                m.route.set("/home")
            }
        })
        .catch(function (e) {
            Login.apiError = e.toString()
        });
}
const input = (attrs) =>
    m('div',
        m("label", { class: "sr-only" }, attrs.label),
        m('input', {
            value: attrs.value,
            class: "form-control",
            type: attrs.type,
            placeholder: attrs.placeholder,
            oninput: e => {
                attrs.value = e.target.value
                validate()
            }
        }),
        attrs.error && m('span.error', attrs.error)
    )
    const validate = () => {
        username.error = username.value.length < 4
          && 'Please enter a username longer than 4 characters'
      
        password.error = password.value.length < 4
          && 'Please enter a password longer than 4 characters'
      }
const Login = {
    apiError:"",
    view: function () {
        return m("div", { class: "form-signin" }, [
            m('header.header', [
                m('h1', 'ZotIt'),
            ]),
            m("h2", { class: "form-signin-heading" }, "Please Sign In / Sign Up"),
            m("p", { class: "form-signin-heading-p" }, "We don't store any personal information other than your email id"),
            m("p", { class: "form-signin-heading-p" }, "If you wish not to provide. you can enter a username."),
            m("p", { class: "form-signin-heading-p" }, "P.S. Without email-id we cannot recover password in case of forgotten."),
            m('br'),

            input(username),
            input(password),
            Login.apiError && m('p.error',Login.apiError),
            m("button.btn.fr", {
                type: "button", onclick: function () {
                    login();
                  
                }
            }, "Sign in"),
            m("button.btn", {
                type: "button", onclick: function () {
                    signup();
                }
            }, "Sign Up")
        ]);
    }
}

export default Login