import React from "react";

const User = (props) => {
  return(
    <div className="user">
      {props.email}
    </div>
  )
}

export default User;