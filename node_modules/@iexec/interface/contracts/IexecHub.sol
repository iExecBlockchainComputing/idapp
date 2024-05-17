pragma solidity >0.5.0 <0.7.0;
pragma experimental ABIEncoderV2;

import "./IexecRegistries.sol";
import "./IexecClerk.sol";
import "./libs/IexecODBLibCore.sol";


interface IexecHubInterface
{
	/***************************************************************************
	 *                            CATEGORY MANAGER                             *
	 ***************************************************************************/
	event CreateCategory(
		uint256 catid,
		string  name,
		string  description,
		uint256 workClockTimeRef);

	function viewCategory(
		uint256 _catid)
	external view returns (IexecODBLibCore.Category memory category);

	function countCategory()
	external view returns (uint256 count);

	function createCategory(
		string  calldata name,
		string  calldata description,
		uint256          workClockTimeRef)
	external returns (uint256);

	/***************************************************************************
	 *                                IEXECHUB                                 *
	 ***************************************************************************/
	event TaskInitialize(bytes32 indexed taskid, address indexed workerpool               );
	event TaskContribute(bytes32 indexed taskid, address indexed worker, bytes32 hash     );
	event TaskConsensus (bytes32 indexed taskid,                         bytes32 consensus);
	event TaskReveal    (bytes32 indexed taskid, address indexed worker, bytes32 digest   );
	event TaskReopen    (bytes32 indexed taskid                                           );
	event TaskFinalize  (bytes32 indexed taskid,                         bytes results    );
	event TaskClaimed   (bytes32 indexed taskid                                           );

	event AccurateContribution(address indexed worker, bytes32 indexed taskid);
	event FaultyContribution  (address indexed worker, bytes32 indexed taskid);

	function CONSENSUS_DURATION_RATIO() external view returns (uint256);
	function REVEAL_DURATION_RATIO   () external view returns (uint256);
	function iexecclerk              () external view returns (IexecClerkInterface);
	function appregistry             () external view returns (AppRegistryInterface);
	function datasetregistry         () external view returns (DatasetRegistryInterface);
	function workerpoolregistry      () external view returns (WorkerpoolRegistryInterface);

	function attachContracts(
		address _iexecclerkAddress,
		address _appregistryAddress,
		address _datasetregistryAddress,
		address _workerpoolregistryAddress)
	external;

	function viewTask(
		bytes32 _taskid)
	external view returns (IexecODBLibCore.Task memory);

	function viewContribution(
		bytes32 _taskid,
		address _worker)
	external view returns (IexecODBLibCore.Contribution memory);

	function viewScore(
		address _worker)
	external view returns (uint256);

	function checkResources(
		address app,
		address dataset,
		address workerpool)
	external view returns (bool);

	function resultFor(
		bytes32 id)
	external view returns (bytes memory);

	function initialize(
		bytes32 _dealid,
		uint256 idx)
	external returns (bytes32);

	function contribute(
		bytes32        _taskid,
		bytes32        _resultHash,
		bytes32        _resultSeal,
		address        _enclaveChallenge,
		bytes calldata _enclaveSign,
		bytes calldata _workerpoolSign)
	external;

	function reveal(
		bytes32 _taskid,
		bytes32 _resultDigest)
	external;

	function reopen(
		bytes32 _taskid)
	external;

	function finalize(
		bytes32 _taskid,
		bytes calldata  _results)
	external;

	function claim(
		bytes32 _taskid)
	external;

	function initializeArray(
		bytes32[] calldata _dealid,
		uint256[] calldata _idx)
	external returns (bool);

	function claimArray(
		bytes32[] calldata _taskid)
	external returns (bool);

	function initializeAndClaimArray(
		bytes32[] calldata _dealid,
		uint256[] calldata _idx)
	external returns (bool);

	function viewTaskABILegacy(bytes32 _taskid)
	external view returns
	( IexecODBLibCore.TaskStatusEnum
	, bytes32
	, uint256
	, uint256
	, uint256
	, uint256
	, uint256
	, bytes32
	, uint256
	, uint256
	, address[] memory
	, bytes     memory
	);

	function viewContributionABILegacy(bytes32 _taskid, address _worker)
	external view returns
	( IexecODBLibCore.ContributionStatusEnum
	, bytes32
	, bytes32
	, address
	);

	function viewCategoryABILegacy(uint256 _catid)
	external view returns (string memory, string memory, uint256);
}
