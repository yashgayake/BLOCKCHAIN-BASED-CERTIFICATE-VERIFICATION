Haan, ye best rahega.
Agar certificateNumber contract me store kar doge, to:

duplicate number ka control strong hoga

AdminPortal me same number dikhega

StudentPortal me same number dikhega

Verify page me same number dikhega

local cache par dependency kam hogi


Kya change hoga

Smart contract me:

Certificate struct me certificateNumber add hoga

issueCertificate() me नया param aayega

CertificateIssued event me bhi certificateNumber add hoga

getCertificate() me bhi return hoga


Frontend me:

blockchain.ts ABI update

service.issueCertificate(...) me certificateNumber pass karna hoga

getCertificate() mapping update hogi

IssueCertificate.tsx me issue ke time contract ko number dena hoga

AdminPortal, StudentPortal, ViewAllRecords, VerifyCertificate me on-chain number read ho sakta hai



---

Sabse pehle updated smart contract

Neeche full updated contract de raha hoon jisme certificateNumber on-chain store hoga.

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title CertificateVerification
 * @dev A smart contract for storing and verifying academic certificates on blockchain
 * @notice This contract is designed for academic certificate verification system
 * @author Final Year Project - Blockchain Based Certificate Verification
 */
contract CertificateVerification {
    
    // ============================================
    // STATE VARIABLES
    // ============================================
    
    address public admin;
    uint256 public totalCertificates;
    
    // ============================================
    // STRUCTS
    // ============================================
    
    struct Certificate {
        string certificateNumber;    // Unique certificate number
        string studentName;
        string enrollmentNumber;
        string course;
        string institution;
        uint256 issueYear;
        uint256 issueDate;
        string certificateHash;
        string ipfsHash;
        address issuerAddress;
        bool exists;
    }
    
    struct Student {
        string name;
        string enrollmentNumber;
        string email;
        string mobileNumber;
        string department;
        string batchYear;
        string password;
        bool isRegistered;
        uint256 registrationDate;
    }
    
    // ============================================
    // MAPPINGS
    // ============================================
    
    mapping(string => Certificate) private certificates; // key = certificateHash
    mapping(string => Student) private students;         // key = enrollmentNumber
    mapping(string => string[]) private studentCertificates;
    mapping(string => bool) private certificateNumberExists; // prevent duplicate numbers
    
    string[] private allCertificateHashes;
    string[] private allEnrollmentNumbers;
    
    // ============================================
    // EVENTS
    // ============================================
    
    event CertificateIssued(
        string indexed certificateHash,
        string certificateNumber,
        string studentName,
        string enrollmentNumber,
        string course,
        uint256 issueDate,
        address issuerAddress
    );
    
    event StudentRegistered(
        string indexed enrollmentNumber,
        string studentName,
        uint256 registrationDate
    );
    
    event CertificateVerified(
        string indexed certificateHash,
        bool isValid,
        uint256 verificationTime
    );
    
    // ============================================
    // MODIFIERS
    // ============================================
    
    modifier onlyAdmin() {
        require(msg.sender == admin, "Access denied: Only admin can perform this action");
        _;
    }
    
    // ============================================
    // CONSTRUCTOR
    // ============================================
    
    constructor() {
        admin = msg.sender;
        totalCertificates = 0;
    }
    
    // ============================================
    // ADMIN FUNCTIONS
    // ============================================
    
    function registerStudent(
        string memory _enrollmentNumber,
        string memory _name,
        string memory _email,
        string memory _mobileNumber,
        string memory _department,
        string memory _batchYear,
        string memory _password
    ) public onlyAdmin {
        require(!students[_enrollmentNumber].isRegistered, "Student already registered");
        require(bytes(_enrollmentNumber).length > 0, "Enrollment number cannot be empty");
        require(bytes(_name).length > 0, "Student name cannot be empty");
        
        students[_enrollmentNumber] = Student({
            name: _name,
            enrollmentNumber: _enrollmentNumber,
            email: _email,
            mobileNumber: _mobileNumber,
            department: _department,
            batchYear: _batchYear,
            password: _password,
            isRegistered: true,
            registrationDate: block.timestamp
        });
        
        allEnrollmentNumbers.push(_enrollmentNumber);
        
        emit StudentRegistered(_enrollmentNumber, _name, block.timestamp);
    }
    
    function issueCertificate(
        string memory _certificateHash,
        string memory _certificateNumber,
        string memory _enrollmentNumber,
        string memory _studentName,
        string memory _course,
        string memory _institution,
        uint256 _issueYear,
        string memory _ipfsHash
    ) public onlyAdmin {
        require(bytes(_certificateHash).length > 0, "Certificate hash cannot be empty");
        require(bytes(_certificateNumber).length > 0, "Certificate number cannot be empty");
        require(!certificates[_certificateHash].exists, "Certificate with this hash already exists");
        require(!certificateNumberExists[_certificateNumber], "Certificate number already exists");
        require(bytes(_enrollmentNumber).length > 0, "Enrollment number cannot be empty");
        require(students[_enrollmentNumber].isRegistered, "Student not registered");
        require(bytes(_studentName).length > 0, "Student name cannot be empty");
        require(bytes(_course).length > 0, "Course cannot be empty");
        require(bytes(_institution).length > 0, "Institution cannot be empty");
        
        certificates[_certificateHash] = Certificate({
            certificateNumber: _certificateNumber,
            studentName: _studentName,
            enrollmentNumber: _enrollmentNumber,
            course: _course,
            institution: _institution,
            issueYear: _issueYear,
            issueDate: block.timestamp,
            certificateHash: _certificateHash,
            ipfsHash: _ipfsHash,
            issuerAddress: msg.sender,
            exists: true
        });
        
        certificateNumberExists[_certificateNumber] = true;
        studentCertificates[_enrollmentNumber].push(_certificateHash);
        allCertificateHashes.push(_certificateHash);
        totalCertificates++;
        
        emit CertificateIssued(
            _certificateHash,
            _certificateNumber,
            _studentName,
            _enrollmentNumber,
            _course,
            block.timestamp,
            msg.sender
        );
    }
    
    // ============================================
    // VERIFICATION FUNCTIONS
    // ============================================
    
    function verifyCertificate(string memory _certificateHash) public returns (bool) {
        bool isValid = certificates[_certificateHash].exists;
        emit CertificateVerified(_certificateHash, isValid, block.timestamp);
        return isValid;
    }
    
    function verifyCertificateView(string memory _certificateHash) public view returns (bool) {
        return certificates[_certificateHash].exists;
    }
    
    // ============================================
    // GETTER FUNCTIONS
    // ============================================
    
    function getCertificate(string memory _certificateHash) public view returns (
        string memory certificateNumber,
        string memory studentName,
        string memory enrollmentNumber,
        string memory course,
        string memory institution,
        uint256 issueYear,
        uint256 issueDate,
        string memory ipfsHash,
        address issuerAddress
    ) {
        require(certificates[_certificateHash].exists, "Certificate does not exist");
        
        Certificate memory cert = certificates[_certificateHash];
        return (
            cert.certificateNumber,
            cert.studentName,
            cert.enrollmentNumber,
            cert.course,
            cert.institution,
            cert.issueYear,
            cert.issueDate,
            cert.ipfsHash,
            cert.issuerAddress
        );
    }
    
    function getStudent(string memory _enrollmentNumber) public view returns (
        string memory name,
        string memory email,
        string memory mobileNumber,
        string memory department,
        string memory batchYear,
        bool isRegistered,
        uint256 registrationDate
    ) {
        Student memory student = students[_enrollmentNumber];
        return (
            student.name,
            student.email,
            student.mobileNumber,
            student.department,
            student.batchYear,
            student.isRegistered,
            student.registrationDate
        );
    }
    
    function verifyStudentLogin(
        string memory _enrollmentNumber,
        string memory _password
    ) public view returns (bool) {
        Student memory student = students[_enrollmentNumber];
        if (!student.isRegistered) return false;
        return keccak256(bytes(student.password)) == keccak256(bytes(_password));
    }
    
    function getStudentCertificates(string memory _enrollmentNumber) public view returns (string[] memory) {
        return studentCertificates[_enrollmentNumber];
    }
    
    function getAllCertificateHashes() public view onlyAdmin returns (string[] memory) {
        return allCertificateHashes;
    }
    
    function getAllEnrollmentNumbers() public view onlyAdmin returns (string[] memory) {
        return allEnrollmentNumbers;
    }
    
    function getTotalCertificates() public view returns (uint256) {
        return totalCertificates;
    }
    
    function getAdmin() public view returns (address) {
        return admin;
    }
    
    function isAdmin() public view returns (bool) {
        return msg.sender == admin;
    }

    function isCertificateNumberExists(string memory _certificateNumber) public view returns (bool) {
        return certificateNumberExists[_certificateNumber];
    }
}


---

Ab iske baad kaunsi files zaroor change hongi

1. src/lib/blockchain.ts

Ye sabse pehle update karni hogi:

ABI update

issueCertificate() me certificateNumber param add

getCertificate() me certificateNumber read

Certificate interface me certificateNumber add

isCertificateNumberExists() bhi add kar sakte ho


2. IssueCertificate.tsx

contract ko certificateNumber pass karna hoga

duplicate number check on-chain bhi kar sakte ho


3. AdminPortal.tsx

fake generated number hat jayega

on-chain certificateNumber use hoga


4. StudentPortal.tsx

on-chain certificateNumber use hoga


5. VerifyCertificate.tsx

verify result me on-chain certificateNumber dikh sakta hai


6. ViewAllRecords.tsx

certificates table me bhi on-chain number add kar sakte ho



---

Important

Is contract ke baad tumhe:

1. compile


2. deploy


3. new contract address copy


4. blockchain.ts update



karna padega.


---

Best next step

Ab mujhe tumhara latest src/lib/blockchain.ts already mila hua hai, aur ab usko is new certificateNumber contract ke hisaab se update karna hai.

Reply karo:

“updated blockchain.ts do”