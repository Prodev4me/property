// url for redirect after payment should be changed

var propertyID = ""
var cost = ""
function pay(prop_id, cost) {
    propertyID = prop_id
    cost = Number(cost) 
}



var stripeHandler = StripeCheckout.configure({
    key: stripePublickey,
    locale: 'en',
    token: function(token) {
        console.log("hello", stripePublickey, propertyID, cost, typeof cost, token)

        fetch('/purchase', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                stripeTokenId: token.id,
                prop_id: propertyID
            })
        }).then(response => {
            if (response.ok) {
            window.location.href = '/';
            } else {
                window.location.href = '/?errorPayment=There was an error with the payment';
                console.error('Error:', response.status);
            }
        })
        .catch(error => {
            console.error('Fetch Error:', error);
        });
          
    }
})


function purchaseClicked(prop_id, cost) {

    try {
        cost = Number(cost).toFixed(2) * 100
        console.log("end", cost, typeof cost, prop_id)
        stripeHandler.open({
            amount: cost
        })
    } catch {
        //if error/ internet connection
        document.getElementById("error_message").textContent = "There was an error, check your internet connection or contact admin"
    }   
   
}

function changeNotice() {
    fetch('/changeNotice', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        body: JSON.stringify({
            read: true
        })
    })
}