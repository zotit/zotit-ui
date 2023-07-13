import { API_URL } from "../config.js";

const username = {
    label: 'Username',
    placeholder: 'Username',
    autofocus: false,
    type: "text",
    value: '',
    error: ''
}

const email = {
    label: 'Email Id',
    placeholder: 'Email address',
    autofocus: false,
    type: "email",
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



function signup() {
    if (!(!username.error && !password.error)) {
        return;
    }

    if (!SignUp.isChecked) {
        SignUp.apiError = "Please check the box to signup."
        return;
    }
    if (!username.value || !password.value || !email.value) {
        SignUp.apiError = "All of the above fields are required to signup."
        return;
    }

    m.request({
        method: 'POST',
        url: API_URL + '/register',
        body: {
            username: username.value,
            password: password.value,
            email_id: email.value
        }
    })
        .then(function (result) {
            SignUp.apiError = false;
            if (result.token && result.token != "") {
                localStorage.setItem("username", username.value)
                localStorage.setItem("token", result.token)
                m.route.set("/home")
            }
        })
        .catch(function (e) {
            SignUp.apiError = e.toString()
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
const SignUp = {
    apiError: "",
    isChecked: false,
    view: function () {
        return m("div", { class: "form-signin" }, [
            m('header.header', [
                m('h1', 'ZotIt'),
            ]),
            m("h2", { class: "form-signin-heading" }, "Please Sign Up"),
            m("p", { class: "form-signin-heading-p" }, "We don't store any personal information other than your email id"),
            m("p", { class: "form-signin-heading-p" }, "P.S. Without a valid email-id we cannot recover password in case of forgotten."),
            m('br'),

            input(email),
            input(username),
            input(password),
            m('div.check', [
                m('input', {
                    type: "checkbox", onchange: function () {
                        SignUp.isChecked = !SignUp.isChecked
                    }
                },),
                m("label", { class: "sr-only" }, ["Please check this box to accept out ",
                    m('a', {
                        href: "http://zotit.twobits.in/privacy-policy.html"
                    }, "Privacy Policy"),
                ]),
            ]),
            SignUp.apiError && m('p.error', SignUp.apiError),
            m("button.btn.fr.btn-red.btn-full.mb-1", {
                type: "button", onclick: function () {
                    signup();
                }
            }, "Sign Up"),
            m("button.btn.btn-full.mb-1", {
                type: "button", onclick: function () {
                    m.route.set('/login')

                }
            }, "Go to login page"),

        ]);
    }
}

export default SignUp