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
    
    /// @notice Address of the admin (deployer) who can issue certificates
    address public admin;
    
    /// @notice Counter for total certificates issued
    uint256 public totalCertificates;
    
    // ============================================
    // STRUCTS
    // ============================================
    
    /// @notice Structure to store certificate details
    struct Certificate {
        string studentName;          // Name of the student
        string enrollmentNumber;     // Unique enrollment number of student
        string course;               // Course/Degree name
        string institution;          // Institution name
        uint256 issueYear;           // Year of issue
        uint256 issueDate;           // Timestamp when certificate was issued
        string certificateHash;      // Unique hash of the certificate
        string ipfsHash;             // IPFS hash for certificate document (optional)
        address issuerAddress;       // Address of the issuer (admin)
        bool exists;                 // Flag to check if certificate exists
    }
    
    /// @notice Structure to store student details
    struct Student {
        string name;
        string enrollmentNumber;
        string email;
        string course;
        string password;             // Institute password for student login
        bool isRegistered;
        uint256 registrationDate;
    }
    
    // ============================================
    // MAPPINGS
    // ============================================
    
    /// @notice Mapping from certificate hash to Certificate struct
    mapping(string => Certificate) private certificates;
    
    /// @notice Mapping from enrollment number to Student struct
    mapping(string => Student) private students;
    
    /// @notice Mapping from enrollment number to array of certificate hashes
    mapping(string => string[]) private studentCertificates;
    
    /// @notice Array to store all certificate hashes (for viewing all records)
    string[] private allCertificateHashes;
    
    /// @notice Array to store all enrollment numbers
    string[] private allEnrollmentNumbers;
    
    // ============================================
    // EVENTS
    // ============================================
    
    /// @notice Event emitted when a new certificate is issued
    event CertificateIssued(
        string indexed certificateHash,
        string studentName,
        string enrollmentNumber,
        string course,
        uint256 issueDate,
        address issuerAddress
    );
    
    /// @notice Event emitted when a new student is registered
    event StudentRegistered(
        string indexed enrollmentNumber,
        string studentName,
        uint256 registrationDate
    );
    
    /// @notice Event emitted when a certificate is verified
    event CertificateVerified(
        string indexed certificateHash,
        bool isValid,
        uint256 verificationTime
    );
    
    // ============================================
    // MODIFIERS
    // ============================================
    
    /// @notice Modifier to restrict access to admin only
    modifier onlyAdmin() {
        require(msg.sender == admin, "Access denied: Only admin can perform this action");
        _;
    }
    
    // ============================================
    // CONSTRUCTOR
    // ============================================
    
    /// @notice Constructor sets the deployer as admin
    constructor() {
        admin = msg.sender;
        totalCertificates = 0;
    }
    
    // ============================================
    // ADMIN FUNCTIONS
    // ============================================
    
    /**
     * @notice Register a new student in the system
     * @param _enrollmentNumber Unique enrollment number
     * @param _name Student's full name
     * @param _email Student's email address
     * @param _course Course/Degree enrolled
     * @param _password Institute password for student login
     */
    function registerStudent(
        string memory _enrollmentNumber,
        string memory _name,
        string memory _email,
        string memory _course,
        string memory _password
    ) public onlyAdmin {
        // Check if student already exists
        require(!students[_enrollmentNumber].isRegistered, "Student already registered");
        require(bytes(_enrollmentNumber).length > 0, "Enrollment number cannot be empty");
        require(bytes(_name).length > 0, "Student name cannot be empty");
        
        // Create new student record
        students[_enrollmentNumber] = Student({
            name: _name,
            enrollmentNumber: _enrollmentNumber,
            email: _email,
            course: _course,
            password: _password,
            isRegistered: true,
            registrationDate: block.timestamp
        });
        
        // Add to all enrollment numbers array
        allEnrollmentNumbers.push(_enrollmentNumber);
        
        // Emit event
        emit StudentRegistered(_enrollmentNumber, _name, block.timestamp);
    }
    
    /**
     * @notice Issue a new certificate to a student
     * @param _certificateHash Unique hash of the certificate
     * @param _enrollmentNumber Student's enrollment number
     * @param _studentName Student's name
     * @param _course Course/Degree name
     * @param _institution Institution name
     * @param _issueYear Year of issue
     * @param _ipfsHash IPFS hash for certificate document (optional)
     */
    function issueCertificate(
        string memory _certificateHash,
        string memory _enrollmentNumber,
        string memory _studentName,
        string memory _course,
        string memory _institution,
        uint256 _issueYear,
        string memory _ipfsHash
    ) public onlyAdmin {
        // Validate inputs
        require(bytes(_certificateHash).length > 0, "Certificate hash cannot be empty");
        require(!certificates[_certificateHash].exists, "Certificate with this hash already exists");
        require(bytes(_enrollmentNumber).length > 0, "Enrollment number cannot be empty");
        require(students[_enrollmentNumber].isRegistered, "Student not registered");
        
        // Create certificate record
        certificates[_certificateHash] = Certificate({
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
        
        // Add certificate hash to student's certificates
        studentCertificates[_enrollmentNumber].push(_certificateHash);
        
        // Add to all certificates array
        allCertificateHashes.push(_certificateHash);
        
        // Increment counter
        totalCertificates++;
        
        // Emit event
        emit CertificateIssued(
            _certificateHash,
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
    
    /**
     * @notice Verify if a certificate exists on blockchain
     * @param _certificateHash The hash of the certificate to verify
     * @return bool True if certificate exists, false otherwise
     */
    function verifyCertificate(string memory _certificateHash) public returns (bool) {
        bool isValid = certificates[_certificateHash].exists;
        
        // Emit verification event
        emit CertificateVerified(_certificateHash, isValid, block.timestamp);
        
        return isValid;
    }
    
    /**
     * @notice Verify certificate (view function - no gas cost)
     * @param _certificateHash The hash of the certificate to verify
     * @return bool True if certificate exists, false otherwise
     */
    function verifyCertificateView(string memory _certificateHash) public view returns (bool) {
        return certificates[_certificateHash].exists;
    }
    
    // ============================================
    // GETTER FUNCTIONS
    // ============================================
    
    /**
     * @notice Get complete certificate details
     * @param _certificateHash The hash of the certificate
     * @return studentName Name of the student
     * @return enrollmentNumber Enrollment number
     * @return course Course name
     * @return institution Institution name
     * @return issueYear Year of issue
     * @return issueDate Timestamp of issue
     * @return ipfsHash IPFS hash
     * @return issuerAddress Address of issuer
     */
    function getCertificate(string memory _certificateHash) public view returns (
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
    
    /**
     * @notice Get student details
     * @param _enrollmentNumber The enrollment number of the student
     * @return name Student name
     * @return email Student email
     * @return course Course name
     * @return isRegistered Registration status
     * @return registrationDate Date of registration
     */
    function getStudent(string memory _enrollmentNumber) public view returns (
        string memory name,
        string memory email,
        string memory course,
        bool isRegistered,
        uint256 registrationDate
    ) {
        Student memory student = students[_enrollmentNumber];
        return (
            student.name,
            student.email,
            student.course,
            student.isRegistered,
            student.registrationDate
        );
    }
    
    /**
     * @notice Verify student login credentials
     * @param _enrollmentNumber Student's enrollment number
     * @param _password Student's password
     * @return bool True if credentials are valid
     */
    function verifyStudentLogin(
        string memory _enrollmentNumber,
        string memory _password
    ) public view returns (bool) {
        Student memory student = students[_enrollmentNumber];
        if (!student.isRegistered) return false;
        return keccak256(bytes(student.password)) == keccak256(bytes(_password));
    }
    
    /**
     * @notice Get all certificate hashes for a student
     * @param _enrollmentNumber Student's enrollment number
     * @return Array of certificate hashes
     */
    function getStudentCertificates(string memory _enrollmentNumber) public view returns (string[] memory) {
        return studentCertificates[_enrollmentNumber];
    }
    
    /**
     * @notice Get all certificate hashes (admin only)
     * @return Array of all certificate hashes
     */
    function getAllCertificateHashes() public view onlyAdmin returns (string[] memory) {
        return allCertificateHashes;
    }
    
    /**
     * @notice Get all enrollment numbers (admin only)
     * @return Array of all enrollment numbers
     */
    function getAllEnrollmentNumbers() public view onlyAdmin returns (string[] memory) {
        return allEnrollmentNumbers;
    }
    
    /**
     * @notice Get total number of certificates issued
     * @return uint256 Total certificates count
     */
    function getTotalCertificates() public view returns (uint256) {
        return totalCertificates;
    }
    
    /**
     * @notice Get admin address
     * @return address Admin address
     */
    function getAdmin() public view returns (address) {
        return admin;
    }
    
    /**
     * @notice Check if caller is admin
     * @return bool True if caller is admin
     */
    function isAdmin() public view returns (bool) {
        return msg.sender == admin;
    }
}
