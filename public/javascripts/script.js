// function addToCart(proId){    
//     $.get('http://localhost:9000/add-to-cart/'+proId,(response)=>{
//         console.log(response)
//         if(response.status){
//            let count=$('#cart-count').html()
//            count=parseInt(count)+1
//            $("#cart-count").html(count)
//         }
//         alert(response)
//     })
// }







// $.get('http://localhost:9000/change-product-quantity/' + cartId + proId + count + quantity, (response) => {

//                 if (response.removeProduct) {
//                     alert("Product Removed from cart")
//                     location.reload()
//                 } else {
//                     document.getElementById(proId).innerHTML = quantity + count
//                 }

//             })