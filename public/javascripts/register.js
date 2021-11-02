// Example starter JavaScript for disabling form submissions if there are invalid fields
(function () {
	'use strict'

	// Fetch all the forms we want to apply custom Bootstrap validation styles to
	var forms = document.querySelectorAll('.needs-validation');
	var email = document.getElementById('email');
	var emailAlert = document.getElementById('emailAlert');
	var password = document.getElementById('password');
	var passAlert = document.getElementById('passAlert');
	
	// Loop over them and prevent submission
	Array.prototype.slice.call(forms)
		.forEach(function (form) {
			form.addEventListener('submit', function (event) {
				if (!form.checkValidity()) {
					event.preventDefault()
					event.stopPropagation()
				}

				form.classList.add('was-validated')
				if(email.value==''){
					emailAlert.innerHTML = '請輸入信箱';
				}
				if(password.value==''){
					passAlert.innerHTML = '請輸入密碼';
				}
			}, false)
		})

	email.addEventListener('input',function (){
		if(email.value==''){
			emailAlert.innerHTML = '請輸入密碼';
		}else if(/^[^a-z0-9]/.test(email.value)){
			emailAlert.innerHTML = '抱歉！您的使用者名稱的第一個字元必須是 ascii 字母 (a-z) 或數字 (0-9)。';
		}else if(/[^a-z0-9]@/.test(email.value)){
			emailAlert.innerHTML = '抱歉！您的使用者名稱的最後一個字元必須是 ascii 字母 (a-z) 或數字 (0-9)。';
		}else if(/\.{2,}/.test(email.value)){
			emailAlert.innerHTML = '抱歉！您的使用者名稱不能包含連續的小數點 (.)。';
		}else if(/[^a-z0-9\.]+@/.test(email.value)){
			emailAlert.innerHTML = '抱歉！只能接受字母 (a-z)、數字 (0-9) 和小數點 (.)';
		}else{
			emailAlert.innerHTML = '信箱格式錯誤'
		}
	},false);

	password.addEventListener('input',function (){
		if(password.value==''){
			passAlert.innerHTML = '請輸入密碼';
		}else if(/^\s|\s$/.test(password.value)){
			passAlert.innerHTML = '密碼的開頭和結尾不可為空格。'
		}else if(password.value.length<=7){
			passAlert.innerHTML = '密碼格式錯誤';
		}
	},false);
})()

function myFunction() {

	if (password.type === "password") {
		password.type = "text";
	} else {
		password.type = "password";
	}
}