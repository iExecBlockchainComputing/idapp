pragma solidity >0.5.0 <0.7.0;


interface AppInterface
{
	function owner()          external view returns (address);
	function m_appName()      external view returns (string memory);
	function m_appType()      external view returns (string memory);
	function m_appMultiaddr() external view returns (bytes  memory);
	function m_appChecksum()  external view returns (bytes32);
	function m_appMREnclave() external view returns (bytes  memory);
}

interface DatasetInterface
{
	function owner()              external view returns (address);
	function m_datasetName()      external view returns (string memory);
	function m_datasetMultiaddr() external view returns (bytes  memory);
	function m_datasetChecksum()  external view returns (bytes32);
}

interface WorkerpoolInterface
{
	event PolicyUpdate(
		uint256 oldWorkerStakeRatioPolicy,
		uint256 newWorkerStakeRatioPolicy,
		uint256 oldSchedulerRewardRatioPolicy,
		uint256 newSchedulerRewardRatioPolicy);

	function owner()                        external view returns (address);
	function m_workerpoolDescription()      external view returns (string memory);
	function m_workerStakeRatioPolicy()     external view returns (uint256);
	function m_schedulerRewardRatioPolicy() external view returns (uint256);

	function changePolicy(
		uint256 _newWorkerStakeRatioPolicy,
		uint256 _newSchedulerRewardRatioPolicy)
	external;
}

interface AppRegistryInterface
{
	event CreateApp(address indexed appOwner, address app);

	function isRegistered(address _entry                ) external view returns (bool);
	function viewEntry   (address _owner, uint256 _index) external view returns (address);
	function viewCount   (address _owner                ) external view returns (uint256);

	function createApp(
		address          _appOwner,
		string  calldata _appName,
		string  calldata _appType,
		bytes   calldata _appMultiaddr,
		bytes32          _appChecksum,
		bytes   calldata _appMREnclave)
	external returns (AppInterface);
}

interface DatasetRegistryInterface
{
	event CreateDataset(address indexed datasetOwner, address dataset);

	function isRegistered(address _entry                ) external view returns (bool);
	function viewEntry   (address _owner, uint256 _index) external view returns (address);
	function viewCount   (address _owner                ) external view returns (uint256);

	function createDataset(
		address          _datasetOwner,
		string  calldata _datasetName,
		bytes   calldata _datasetMultiaddr,
		bytes32          _datasetChecksum)
	external returns (DatasetInterface);
}

interface WorkerpoolRegistryInterface
{
	event CreateWorkerpool(address indexed workerpoolOwner, address indexed workerpool, string workerpoolDescription);

	function isRegistered(address _entry                ) external view returns (bool);
	function viewEntry   (address _owner, uint256 _index) external view returns (address);
	function viewCount   (address _owner                ) external view returns (uint256);

	function createWorkerpool(
		address          _workerpoolOwner,
		string  calldata _workerpoolDescription)
	external returns (WorkerpoolInterface);
}
