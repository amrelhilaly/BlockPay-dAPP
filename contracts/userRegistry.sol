// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract UserRegistry {
    struct User {
        address userAddress;
        string username;
        bool registered;
    }

    mapping(address => User) public users;

    event UserRegistered(address indexed user, string username);

    /// @notice Register yourself with a username
    function register(string calldata _username) external {
        require(!users[msg.sender].registered, "Already registered");
        users[msg.sender] = User({
            userAddress: msg.sender,
            username: _username,
            registered: true
        });
        emit UserRegistered(msg.sender, _username);
    }

    /// @notice Check if a given address is registered
    function isRegistered(address _user) external view returns (bool) {
        return users[_user].registered;
    }

    /// @notice Get username of a registered user
    function getUsername(address _user) external view returns (string memory) {
        require(users[_user].registered, "Not registered");
        return users[_user].username;
    }
}
