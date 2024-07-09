const { WC_Group } = require("../model/Groups/group");
const { WC_grp_members } = require("../model/Groups/member");
const { WC_Auth } = require("../model/users");
const { CreateMember } = require("../services/members");
const { authenticateByTokenAndUserID } = require("../utils/Authentication");

exports.UpdateMemberRole = async (data) => {
    const { token,
        userID, memberID, role } = data;
    try {
        const isAuthenticated = await authenticateByTokenAndUserID(
            token,
            userID
        ).then((data) => data);
        if (token && isAuthenticated) {
            const UserData = isAuthenticated;
            if (UserData) {
                const memberData = await WC_grp_members.findById(memberID);
                if (memberData) {
                    memberData.role = role;
                    const result = await memberData.save();
                    if (result) {
                        return { status: "ok", message: "Updated successfully" };
                    } else {
                        return { status: "error", message: "Updation failed" }
                    }
                } else {
                    return { status: "error", message: "Member not found" };
                }
            } else {
                return { status: "error", message: "User not found" };
            }
        } else {
            return { status: "error", message: "Un-authorized" };
        }
    } catch (error) {
        console.log("getAllMembers", error);
    }
};
exports.RemoveMemberFromGroup = async (data) => {
    const { token,
        userID, memberID, groupID } = data;
    try {
        const isAuthenticated = await authenticateByTokenAndUserID(
            token,
            userID
        ).then((data) => data);
        if (token && isAuthenticated) {
            const UserData = isAuthenticated;
            if (UserData) {
                const Group = await WC_Group.findById(groupID);
                const UserToRemove = memberID;

                try {
                    if (!UserToRemove) {
                        return {
                            status: "error",
                            message: "Member not selected",
                        };
                    }
                    if (Group) {
                        const Member = await WC_grp_members.findByIdAndDelete(UserToRemove);
                        if (Member) {
                            Group.members = Group.members.filter((i) => i != UserToRemove);
                            const IsRemoved = await Group.save();
                            if (IsRemoved) {
                                return {
                                    status: "ok",
                                    message: "User Removed successfully",
                                };
                            } else {
                                return {
                                    status: "error",
                                    message: "Member not removed",
                                };
                            }
                        } else {
                            return {
                                status: "error",
                                message: "Member not found",
                            };
                        }
                    } else {
                        return { status: "error", message: "Group not found" };
                    }
                } catch (error) {
                    return { message: "Error fetching or merging members:", status: 'error' };
                }
            } else {
                return { status: "error", message: "User not found" };
            }
        } else {
            return { status: "error", message: "Un-authorized" };
        }
    } catch (error) {
        console.log("GetMembersByGroupID", error);
        next(error);
    }
};
exports.AddMembersToGroup = async (data) => {
    const { token,
        userID, memberID, groupID, ids } = data;
    try {
        const isAuthenticated = await authenticateByTokenAndUserID(
            token,
            userID
        ).then((data) => data);
        if (token && isAuthenticated) {
            const UserData = isAuthenticated;
            if (UserData) {
                const Group = await WC_Group.findById(groupID);
                const membersToAdd = ids;
                try {
                    if (membersToAdd.length == 0) {
                        return {
                            status: "error",
                            message: "Members Empty",
                        };
                    }
                    if (Group) {
                        const AllUsers = await WC_Auth.find({});
                        const UserIDs = AllUsers.map((i) => i._id.toHexString());
                        const memberUserIDsInGroup = await Promise.all(
                            Group.members.map(async (member) => {
                                try {
                                    const memberUserID = await WC_grp_members.findById(member);
                                    return memberUserID.user_id;
                                } catch (error) {
                                    console.error(
                                        `Error fetching member with ID ${member}:`,
                                        error
                                    );
                                    throw error;
                                }
                            })
                        );
                        const verifiedUsersToAdd = membersToAdd.filter((i) => {
                            return !memberUserIDsInGroup.includes(i.user_id);
                        });
                        if (verifiedUsersToAdd.length !== 0) {
                            await Promise.all(
                                verifiedUsersToAdd.map(async (i) => {
                                    if (UserIDs.includes(i.user_id)) {
                                        const IsCreated = await CreateMember(
                                            i.user_id,
                                            i.role
                                        ).then((data) => data);

                                        if (IsCreated.status == "ok") {
                                            Group.members.push(IsCreated.data._id);
                                            const UserData = await WC_Auth.findById(i.user_id);
                                            UserData.groups.push(groupID);
                                            const IsGroupLinked = await UserData.save();
                                            if (IsGroupLinked) {
                                                const isAdded = await Group.save();
                                                console.log(isAdded, 'test');

                                                if (isAdded) {
                                                    return { status: "ok", message: "User added" };
                                                } else {
                                                    return {
                                                        status: "error",
                                                        message: "Adding user failed",
                                                    };
                                                }
                                            } else {
                                                return {
                                                    status: "error",
                                                    message: "Linking group failed",
                                                };
                                            }
                                        } else {
                                            return { status: "error", message: IsCreated.message };
                                        }
                                    } else {
                                        return { status: "error", message: "User not found" };
                                    }
                                })
                            );
                        } else {
                            return {
                                status: "error",
                                message: "Users already in this group",
                            };
                        }
                    } else {
                        return { status: "error", message: "Group not found" };
                    }
                } catch (error) {
                    console.error("Error fetching or merging members:", error);
                }
            } else {
                return { status: "error", message: "User not found" };
            }
        } else {
            return { status: "error", message: "Un-authorized" };
        }
    } catch (error) {
        console.log("GetMembersByGroupID", error);
    }
}