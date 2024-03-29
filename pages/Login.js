import { API_URL } from "../config.js";

const username = {
    label: 'Username',
    placeholder: 'Username',
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
    if (!(!username.error && !password.error)) {
        return;
    }
    m.request({
        method: 'POST',
        url: API_URL + '/login',
        body: {
            username: username.value,
            password: password.value
        }
    })
        .then(function (result) {
            Login.apiError = false;
            if (result.token && result.token != "") {
                localStorage.setItem("username", username.value)
                localStorage.setItem("token", result.token)
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
    apiError: "",
    isChecked: false,
    view: function () {
        return m("div", { class: "form-signin" }, [
            m('header.header', [
                m('h1', 'ZotIt'),
            ]),
            m("h2", { class: "form-signin-heading" }, "Please Sign In"),
            m("h3", "You can download the app from the Android Play Store as well ",
                m('a', {"target": "_blank", href: "https://play.google.com/store/apps/details?id=in.twobits.zotit" }, "Android Play Store")
            ),
            m('br'),

            input(username),
            input(password),

            Login.apiError && m('p.error', Login.apiError),
            m("button.btn.fr.btn-red.btn-full.mb-1", {
                type: "button", onclick: function () {
                    login();

                }
            }, "Sign in"),
            m("button.btn.btn-full.mb-1", {
                type: "button", onclick: function () {
                    m.route.set('/signup')
                }
            }, "Go to Sign Up Page"),
            m("p", { class: "form-signin-heading-p" }, "In case of forgot password please go to ",
                m('a', { href: "https://web.zotit.app", "target": "_blank" }, "https://web.zotit.app")
            ),

        ]);
    }
}

export default Login